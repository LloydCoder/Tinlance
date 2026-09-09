import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPrincipal, enforceSecurity, hashSensitive, type PrincipalType } from "@/lib/security-gateway";
import { hasWorkspacePermission, type WorkspacePermission } from "@/lib/workspace/permissions";

export type KnowledgeVisibility = "PUBLIC" | "PLATFORM_INTERNAL" | "ORGANIZATION_PRIVATE" | "TEAM_RESTRICTED" | "PROJECT_RESTRICTED" | "USER_PRIVATE";
export type KnowledgeClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "SECRET";
export type KnowledgeAuthority = "AUTHORITATIVE" | "APPROVED" | "INTERNAL" | "UNVERIFIED" | "EXTERNAL" | "QUARANTINED";
export type KnowledgePrincipal = { principalId: string; organizationId?: string; principalType: PrincipalType; userId?: string; agentId?: string; requestId: string };
export type KnowledgeResult = { rank: number; documentId: string; documentVersionId: string; title: string; location: string | null; authority: KnowledgeAuthority; classification: KnowledgeClassification; content: string; citation: { title: string; location: string | null; version: string; contentHash: string } };

const MAX_CONTENT = 2_000_000;
const MAX_CHUNKS = 2_000;
const MAX_RESULTS = 25;

export function sha(value: string) { return createHash("sha256").update(value).digest("hex"); }
export function normalize(text: string) { return text.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g, " ").replace(/[ \t]+/g, " ").trim(); }
export function secretLike(text: string) { return /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{12,}|postgres(?:ql)?:\/\/[^\s]+|Bearer\s+[A-Za-z0-9._~+\-/]+=*)/i.test(text); }

export function splitChunks(text: string) {
  const sections = text.split(/(?=^#{1,6}\s+)/m).map((s) => s.trim()).filter(Boolean);
  const source = sections.length ? sections : [text];
  const out: string[] = [];
  for (const section of source) {
    if (section.length <= 1600) out.push(section);
    else for (let i = 0; i < section.length; i += 1400) out.push(section.slice(i, i + 1400));
  }
  if (out.length > MAX_CHUNKS) throw new Error("knowledge_chunk_limit_exceeded");
  return out;
}

async function memberFor(input: KnowledgePrincipal) {
  if (input.principalType !== "HUMAN" || !input.userId || !input.organizationId) return null;
  const rows = await db.$queryRaw<Array<{ role: string; globalRole: string }>>(Prisma.sql`SELECT m.role, u.role AS "globalRole" FROM "Member" m JOIN "User" u ON u.id=m."userId" WHERE m."organizationId"=${input.organizationId} AND m."userId"=${input.userId} LIMIT 1`);
  return rows[0] ?? null;
}

async function humanPermission(input: KnowledgePrincipal, permission: WorkspacePermission) {
  const member = await memberFor(input);
  return Boolean(member && hasWorkspacePermission({ memberRole: member.role, isPrivileged: ["admin", "super-admin"].includes(member.globalRole) }, permission));
}

async function authorizeRead(input: KnowledgePrincipal, classification: KnowledgeClassification) {
  if (input.principalType === "AI_AGENT") {
    if (!input.organizationId || !input.agentId) return { ok: false, reason: "AGENT_IDENTITY_REQUIRED" };
    if (classification === "SECRET") return { ok: false, reason: "SECRET_KNOWLEDGE_DENIED" };
    const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.principalId, principalType: "AI_AGENT", organizationId: input.organizationId, agentId: input.agentId, scopes: ["knowledge:read"], permissions: ["knowledge:read"], authenticationMethod: "m9-runtime" }), action: "knowledge.read", resourceType: "Knowledge", dataClassification: classification, context: { tenantId: input.organizationId, requiredPermission: "knowledge:read" }, requestId: input.requestId });
    if (m7.decision !== "ALLOW") return { ok: false, reason: m7.reasonCode };
    return { ok: true, reason: "M7_ALLOWED" };
  }
  if (!(await humanPermission(input, "knowledge:read"))) return { ok: false, reason: "INSUFFICIENT_PERMISSION" };
  if (input.organizationId) {
    const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.principalId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId }), action: "knowledge.read", resourceType: "Knowledge", dataClassification: classification, context: { tenantId: input.organizationId, requiredPermission: "knowledge:read" }, requestId: input.requestId });
    if (m7.decision !== "ALLOW") return { ok: false, reason: m7.reasonCode };
  }
  return { ok: true, reason: "POLICY_ALLOWED" };
}

export async function createCollection(input: KnowledgePrincipal & { name: string; description?: string; visibility: KnowledgeVisibility; classification: KnowledgeClassification; scopeType?: string; projectId?: string; assessmentId?: string }) {
  if (!input.organizationId) throw new Error("knowledge_tenant_required");
  if (!(await humanPermission(input, "knowledge:create"))) throw new Error("knowledge_create_denied");
  if (input.visibility === "PLATFORM_INTERNAL" || input.visibility === "PUBLIC") throw new Error("knowledge_visibility_requires_platform_governance");
  if (input.visibility === "PROJECT_RESTRICTED" && !input.projectId) throw new Error("knowledge_project_scope_required");
  if (input.visibility === "USER_PRIVATE" && !input.userId) throw new Error("knowledge_user_scope_required");
  const id = `knc_${randomUUID().replaceAll("-", "")}`;
  await db.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeCollection" ("id","organizationId","name","description","visibility","classification","scopeType","projectId","assessmentId","createdByUserId") VALUES (${id},${input.organizationId},${input.name},${input.description ?? null},${input.visibility},${input.classification},${input.scopeType ?? "ORGANIZATION"},${input.projectId ?? null},${input.assessmentId ?? null},${input.userId ?? input.principalId})`);
  return { id };
}

export async function ingestText(input: KnowledgePrincipal & { collectionId: string; title: string; content: string; sourceType?: string; authority?: KnowledgeAuthority; classification?: KnowledgeClassification; visibility?: KnowledgeVisibility; allowedRoles?: string[]; allowedUsers?: string[]; allowedTeams?: string[]; projectId?: string; assessmentId?: string; idempotencyKey: string }) {
  if (input.content.length > MAX_CONTENT) throw new Error("knowledge_content_limit_exceeded");
  const content = normalize(input.content);
  if (!content) throw new Error("knowledge_empty_content");
  if (secretLike(content)) throw new Error("knowledge_secret_detected");
  if (!(await humanPermission(input, "knowledge:ingest"))) throw new Error("knowledge_ingest_denied");
  const collection = await db.$queryRaw<Array<{ organizationId: string; visibility: KnowledgeVisibility; classification: KnowledgeClassification; projectId: string | null; assessmentId: string | null }>>(Prisma.sql`SELECT "organizationId",visibility,classification,"projectId","assessmentId" FROM "KnowledgeCollection" WHERE id=${input.collectionId} AND status='ACTIVE' LIMIT 1`);
  const c = collection[0];
  if (!c || c.organizationId !== input.organizationId) throw new Error("knowledge_collection_not_found");
  if (input.projectId && c.projectId && input.projectId !== c.projectId) throw new Error("knowledge_scope_mismatch");
  if (input.assessmentId && c.assessmentId && input.assessmentId !== c.assessmentId) throw new Error("knowledge_scope_mismatch");
  const contentHash = sha(content);
  const existing = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "KnowledgeDocument" WHERE "organizationId"=${input.organizationId} AND "contentHash"=${contentHash} AND "collectionId"=${input.collectionId} AND status NOT IN ('DELETED','REVOKED') LIMIT 1`);
  if (existing[0]) return { id: existing[0].id, deduplicated: true };
  const documentId = `knd_${randomUUID().replaceAll("-", "")}`;
  const versionId = `knv_${randomUUID().replaceAll("-", "")}`;
  const jobId = `kjob_${randomUUID().replaceAll("-", "")}`;
  const correlationId = randomUUID();
  const visibility = input.visibility ?? c.visibility;
  const classification = input.classification ?? c.classification;
  const authority = input.authority ?? "UNVERIFIED";
  if (classification === "SECRET") throw new Error("knowledge_secret_classification_requires_secure_ingestion");
  if (visibility !== c.visibility) throw new Error("knowledge_visibility_mismatch");
  const chunks = splitChunks(content);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeDocument" ("id","organizationId","collectionId","title","sourceType","status","visibility","classification","authority","contentHash","createdByUserId") VALUES (${documentId},${input.organizationId},${input.collectionId},${input.title},${input.sourceType ?? "TEXT"},'QUARANTINED',${visibility},${classification},${authority},${contentHash},${input.userId ?? input.principalId})`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeDocumentVersion" ("id","organizationId","documentId","version","sourceHash","normalizedHash","content","status","reviewStatus","createdByUserId") VALUES (${versionId},${input.organizationId},${documentId},1,${sha(input.content)},${contentHash},${content},'PROCESSING','DRAFT',${input.userId ?? input.principalId})`);
    for (let i = 0; i < chunks.length; i++) await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeChunk" ("id","organizationId","collectionId","documentId","documentVersionId","ordinal","content","contentHash","location","classification","visibility","allowedRoles","allowedUsers","allowedTeams","projectId","assessmentId","permissionVersion","authority","embeddingModel","embeddingVersion","status") VALUES (${`knc_${randomUUID().replaceAll("-", "")}`},${input.organizationId},${input.collectionId},${documentId},${versionId},${i},${chunks[i]},${sha(chunks[i])},${`chunk:${i + 1}`},${classification},${visibility},${JSON.stringify(input.allowedRoles ?? [])}::jsonb,${JSON.stringify(input.allowedUsers ?? [])}::jsonb,${JSON.stringify(input.allowedTeams ?? [])}::jsonb,${input.projectId ?? c.projectId ?? null},${input.assessmentId ?? c.assessmentId ?? null},1,${authority},'lexical-v1','1','REVOKED')`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeIngestionJob" ("id","organizationId","documentId","documentVersionId","idempotencyKey","correlationId","status","createdByUserId") VALUES (${jobId},${input.organizationId},${documentId},${versionId},${input.idempotencyKey},${correlationId},'PROCESSING',${input.userId ?? input.principalId}) ON CONFLICT ("organizationId","idempotencyKey") DO NOTHING`);
  });
  await db.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.userId ?? null, action: "M10_KNOWLEDGE_INGESTED", resourceType: "KnowledgeDocument", resourceId: documentId, requestId: input.requestId, metadata: { versionId, chunkCount: chunks.length, contentHash, classification, visibility, authority, status: "QUARANTINED" } } });
  return { id: documentId, versionId, chunkCount: chunks.length, contentHash, status: "QUARANTINED" as const };
}

export async function revokeDocument(input: KnowledgePrincipal & { documentId: string }) {
  if (!(await humanPermission(input, "knowledge:delete"))) throw new Error("knowledge_delete_denied");
  await revokeKnowledgeRows(input);
}

export async function revokeKnowledgeRows(input: { documentId: string; organizationId?: string; userId?: string; requestId?: string }) {
  if (!input.organizationId) throw new Error("knowledge_tenant_required");
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocument" SET status='REVOKED',"revokedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${input.documentId} AND "organizationId"=${input.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeChunk" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocumentVersion" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`);
  });
  await db.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.userId ?? null, action: "M10_KNOWLEDGE_REVOKED", resourceType: "KnowledgeDocument", resourceId: input.documentId, requestId: input.requestId ?? null, metadata: { securityBoundary: "M10" } } });
}

export async function retrieveKnowledge(input: KnowledgePrincipal & { query: string; projectId?: string; assessmentId?: string; collectionId?: string; maxResults?: number; maxClassification?: KnowledgeClassification }) {
  const started = Date.now();
  const query = normalize(input.query);
  if (!query || query.length > 2000) throw new Error("invalid_knowledge_query");
  const requestedClassification = input.maxClassification ?? "CONFIDENTIAL";
  const auth = await authorizeRead(input, requestedClassification);
  if (!auth.ok) { await recordAccess(input, "DENY", auth.reason); throw new Error("knowledge_access_denied"); }
  const max = Math.min(Math.max(input.maxResults ?? 5, 1), MAX_RESULTS);
  const queryHash = hashSensitive(query);
  const userId = input.userId ?? "";
  const rows = await db.$queryRaw<Array<{ id: string; organizationId: string; collectionId: string; documentId: string; documentVersionId: string; title: string; content: string; contentHash: string; location: string | null; classification: KnowledgeClassification; visibility: KnowledgeVisibility; authority: KnowledgeAuthority; projectId: string | null; assessmentId: string | null; rank: number }>>(Prisma.sql`SELECT c.id,c."organizationId",c."collectionId",c."documentId",c."documentVersionId",d.title,c.content,c."contentHash",c.location,c.classification,c.visibility,c.authority,c."projectId",c."assessmentId",ts_rank_cd(c."searchVector", plainto_tsquery('simple', ${query})) AS rank FROM "KnowledgeChunk" c JOIN "KnowledgeDocument" d ON d.id=c."documentId" AND d.status='ACTIVE' JOIN "KnowledgeDocumentVersion" v ON v.id=c."documentVersionId" AND v.status='ACTIVE' JOIN "KnowledgeCollection" col ON col.id=c."collectionId" AND col.status='ACTIVE' WHERE c.status='ACTIVE' AND c."organizationId"=${input.organizationId ?? null} AND (${input.collectionId ?? null} IS NULL OR c."collectionId"=${input.collectionId ?? null}) AND classification_rank(c.classification) <= classification_rank(${requestedClassification}) AND c.classification <> 'SECRET' AND (${input.projectId ?? null} IS NULL OR c."projectId"=${input.projectId ?? null}) AND (${input.assessmentId ?? null} IS NULL OR c."assessmentId"=${input.assessmentId ?? null}) AND (c.visibility NOT IN ('PROJECT_RESTRICTED') OR ${input.projectId ?? null} IS NOT NULL) AND (c.visibility NOT IN ('USER_PRIVATE') OR ${userId}=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedUsers")))) AND (c."allowedUsers"='[]'::jsonb OR ${userId}=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedUsers")))) AND (c.visibility <> 'TEAM_RESTRICTED' AND c."allowedTeams"='[]'::jsonb) AND (c."allowedRoles"='[]'::jsonb OR EXISTS (SELECT 1 FROM "Member" m WHERE m."organizationId"=${input.organizationId ?? null} AND m."userId"=${userId} AND m.role=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedRoles")))) ) AND (${input.principalType}='HUMAN' OR EXISTS (SELECT 1 FROM "KnowledgeAgentGrant" g WHERE g."organizationId"=c."organizationId" AND g."agentId"=${input.agentId ?? ''} AND g."collectionId"=c."collectionId" AND g."revokedAt" IS NULL AND (g."expiresAt" IS NULL OR g."expiresAt">CURRENT_TIMESTAMP) AND classification_rank(g."maxClassification") >= classification_rank(c.classification) AND (g.scope='{}'::jsonb OR (g.scope->'projectIds' IS NULL OR c."projectId"=ANY(ARRAY(SELECT jsonb_array_elements_text(g.scope->'projectIds')))) AND (g.scope->'assessmentIds' IS NULL OR c."assessmentId"=ANY(ARRAY(SELECT jsonb_array_elements_text(g.scope->'assessmentIds'))))) ) AND ((${input.principalType}='HUMAN' AND c.visibility<>'PLATFORM_INTERNAL') OR (${input.principalType}='HUMAN' AND EXISTS (SELECT 1 FROM "User" u WHERE u.id=${userId} AND u.role IN ('admin','super-admin') AND c.visibility='PLATFORM_INTERNAL')) ) AND (${input.principalType}='HUMAN' OR c.visibility NOT IN ('PLATFORM_INTERNAL')) AND plainto_tsquery('simple', ${query}) @@ c."searchVector" ORDER BY rank DESC,c."createdAt" DESC LIMIT ${max}`);
  if (rows.some((row) => sha(row.content) !== row.contentHash)) { await recordAccess(input, "DENY", "KNOWLEDGE_INTEGRITY_FAILURE"); throw new Error("knowledge_integrity_failure"); }
  const retrievalId = `knr_${randomUUID().replaceAll("-", "")}`;
  const results: KnowledgeResult[] = rows.map((row, index) => ({ rank: index + 1, documentId: row.documentId, documentVersionId: row.documentVersionId, title: row.title, location: row.location, authority: row.authority, classification: row.classification, content: row.content, citation: { title: row.title, location: row.location, version: row.documentVersionId, contentHash: row.contentHash } }));
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeRetrieval" ("id","organizationId","principalId","principalType","agentId","queryHash","scope","candidateCount","authorizedCandidateCount","selectedCount","method","latencyMs") VALUES (${retrievalId},${input.organizationId ?? null},${input.principalId},${input.principalType},${input.agentId ?? null},${queryHash},${JSON.stringify({collectionId: input.collectionId ?? null, projectId: input.projectId ?? null, assessmentId: input.assessmentId ?? null})}::jsonb,1,${rows.length},${rows.length},'LEXICAL',${Date.now() - started})`);
    for (const result of results) await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeCitation" ("id","retrievalId","chunkId","documentId","documentVersionId","rank","title","location","contentHash") VALUES (${randomUUID()},${retrievalId},${rows[result.rank - 1].id},${result.documentId},${result.documentVersionId},${result.rank},${result.title},${result.location},${result.citation.contentHash})`);
  });
  await recordAccess(input, "ALLOW", "RETRIEVAL_AUTHORIZED", retrievalId);
  return { supported: results.length > 0, retrievalId, method: "LEXICAL" as const, results };
}

async function recordAccess(input: KnowledgePrincipal, decision: "ALLOW" | "DENY", reasonCode: string, retrievalId?: string) {
  await db.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeAccessEvent" ("id","organizationId","principalId","principalType","agentId","action","resourceType","retrievalId","decision","reasonCode","requestId") VALUES (${randomUUID()},${input.organizationId ?? null},${input.principalId},${input.principalType},${input.agentId ?? null},'READ','Knowledge',${retrievalId ?? null},${decision},${reasonCode},${input.requestId})`);
}

export function buildGroundedContext(results: KnowledgeResult[]) {
  return results.map((item) => `<authorized-knowledge source="${escapeXml(item.documentId)}" version="${escapeXml(item.documentVersionId)}" location="${escapeXml(item.location ?? "unknown")}" classification="${escapeXml(item.classification)}" authority="${escapeXml(item.authority)}">BEGIN RETRIEVED DATA\n${item.content}\nEND RETRIEVED DATA</authorized-knowledge>`).join("\n");
}

function escapeXml(value: string) { return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
