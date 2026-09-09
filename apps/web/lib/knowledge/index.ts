import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPrincipal, enforceSecurity, hashSensitive, type PrincipalType } from "@/lib/security-gateway";
import { hasWorkspacePermission, type WorkspacePermission } from "@/lib/workspace/permissions";

export type KnowledgeVisibility = "PUBLIC" | "PLATFORM_INTERNAL" | "ORGANIZATION_PRIVATE" | "TEAM_RESTRICTED" | "PROJECT_RESTRICTED" | "USER_PRIVATE";
export type KnowledgeClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "SECRET";
export type KnowledgeAuthority = "AUTHORITATIVE" | "APPROVED" | "INTERNAL" | "UNVERIFIED" | "EXTERNAL" | "QUARANTINED";
export type KnowledgePrincipal = { principalId: string; organizationId?: string; principalType: PrincipalType; userId?: string; agentId?: string; requestId: string };
const MAX_CONTENT = 2_000_000;
const MAX_CHUNKS = 2_000;
const MAX_RESULTS = 25;
const classificationRank: Record<KnowledgeClassification, number> = { PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3, SECRET: 4 };

function sha(value: string) { return createHash("sha256").update(value).digest("hex"); }
function normalize(text: string) { return text.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").replace(/[ \t]+/g, " ").trim(); }
function secretLike(text: string) { return /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s]{12,}|postgres(?:ql)?:\/\/[^\s]+|Bearer\s+[A-Za-z0-9._~+\-/]+=*)/i.test(text); }
function splitChunks(text: string) {
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

async function humanPermission(input: KnowledgePrincipal, permission: WorkspacePermission) {
  if (input.principalType !== "HUMAN" || !input.userId || !input.organizationId) return false;
  const rows = await db.$queryRaw<Array<{ role: string; globalRole: string }>>(Prisma.sql`SELECT m.role, u.role AS "globalRole" FROM "Member" m JOIN "User" u ON u.id=m."userId" WHERE m."organizationId"=${input.organizationId} AND m."userId"=${input.userId} LIMIT 1`);
  const member = rows[0];
  if (!member) return false;
  return hasWorkspacePermission({ memberRole: member.role, isPrivileged: ["admin", "super-admin"].includes(member.globalRole) }, permission);
}

async function authorizeRead(input: KnowledgePrincipal, classification: KnowledgeClassification) {
  if (input.principalType === "AI_AGENT") {
    if (!input.organizationId || !input.agentId) return { ok: false, reason: "AGENT_IDENTITY_REQUIRED" };
    const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.principalId, principalType: "AI_AGENT", organizationId: input.organizationId, agentId: input.agentId, scopes: ["knowledge:read"], permissions: ["knowledge:read"], authenticationMethod: "m9-runtime" }), action: "knowledge.read", resourceType: "Knowledge", dataClassification: classification, context: { tenantId: input.organizationId, requiredPermission: "knowledge:read" }, requestId: input.requestId });
    if (m7.decision !== "ALLOW") return { ok: false, reason: m7.reasonCode };
    const grants = await db.$queryRaw<Array<{ maxClassification: KnowledgeClassification }>>(Prisma.sql`SELECT "maxClassification" FROM "KnowledgeAgentGrant" WHERE "organizationId"=${input.organizationId} AND "agentId"=${input.agentId} AND "revokedAt" IS NULL AND ("expiresAt" IS NULL OR "expiresAt">CURRENT_TIMESTAMP) LIMIT 100`);
    return grants.some((g) => classificationRank[g.maxClassification] >= classificationRank[classification]) ? { ok: true, reason: "AGENT_GRANT" } : { ok: false, reason: "AGENT_KNOWLEDGE_SCOPE_DENIED" };
  }
  const allowed = await humanPermission(input, "knowledge:read");
  if (!allowed) return { ok: false, reason: "INSUFFICIENT_PERMISSION" };
  if (input.organizationId) {
    const m7 = await enforceSecurity({ principal: buildPrincipal({ principalId: input.principalId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId }), action: "knowledge.read", resourceType: "Knowledge", dataClassification: classification, context: { tenantId: input.organizationId, requiredPermission: "knowledge:read" }, requestId: input.requestId });
    if (m7.decision !== "ALLOW") return { ok: false, reason: m7.reasonCode };
  }
  return { ok: true, reason: "POLICY_ALLOWED" };
}

export async function createCollection(input: KnowledgePrincipal & { name: string; description?: string; visibility: KnowledgeVisibility; classification: KnowledgeClassification; scopeType?: string; projectId?: string; assessmentId?: string }) {
  if (!input.organizationId && !["PUBLIC", "PLATFORM_INTERNAL"].includes(input.visibility)) throw new Error("knowledge_tenant_required");
  if (!(await humanPermission(input, "knowledge:create"))) throw new Error("knowledge_create_denied");
  const id = `knc_${randomUUID().replaceAll("-", "")}`;
  await db.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeCollection" ("id","organizationId","name","description","visibility","classification","scopeType","projectId","assessmentId","createdByUserId") VALUES (${id},${input.organizationId ?? null},${input.name},${input.description ?? null},${input.visibility},${input.classification},${input.scopeType ?? "ORGANIZATION"},${input.projectId ?? null},${input.assessmentId ?? null},${input.userId ?? input.principalId})`);
  return { id };
}

export async function ingestText(input: KnowledgePrincipal & { collectionId: string; title: string; content: string; sourceType?: string; authority?: KnowledgeAuthority; classification?: KnowledgeClassification; visibility?: KnowledgeVisibility; allowedRoles?: string[]; allowedUsers?: string[]; projectId?: string; assessmentId?: string; idempotencyKey: string }) {
  if (input.content.length > MAX_CONTENT) throw new Error("knowledge_content_limit_exceeded");
  if (secretLike(input.content)) throw new Error("knowledge_secret_detected");
  if (!(await humanPermission(input, "knowledge:ingest"))) throw new Error("knowledge_ingest_denied");
  const collection = await db.$queryRaw<Array<{ organizationId: string | null; visibility: KnowledgeVisibility; classification: KnowledgeClassification }>>(Prisma.sql`SELECT "organizationId",visibility,classification FROM "KnowledgeCollection" WHERE id=${input.collectionId} AND status='ACTIVE' LIMIT 1`);
  const c = collection[0]; if (!c) throw new Error("knowledge_collection_not_found");
  if (c.organizationId && c.organizationId !== input.organizationId) throw new Error("knowledge_tenant_mismatch");
  const content = normalize(input.content); if (!content) throw new Error("knowledge_empty_content");
  const contentHash = sha(content); const existing = await db.$queryRaw<Array<{ id: string; status: string }>>(Prisma.sql`SELECT id,status FROM "KnowledgeDocument" WHERE "organizationId" IS NOT DISTINCT FROM ${input.organizationId ?? null} AND "contentHash"=${contentHash} AND "collectionId"=${input.collectionId} AND status NOT IN ('DELETED','REVOKED') LIMIT 1`); if (existing[0]) return { id: existing[0].id, deduplicated: true };
  const documentId = `knd_${randomUUID().replaceAll("-", "")}`; const versionId = `knv_${randomUUID().replaceAll("-", "")}`; const jobId = `kjob_${randomUUID().replaceAll("-", "")}`; const correlationId = randomUUID();
  const visibility = input.visibility ?? c.visibility; const classification = input.classification ?? c.classification; const authority = input.authority ?? "UNVERIFIED";
  const chunks = splitChunks(content);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeDocument" ("id","organizationId","collectionId","title","sourceType","status","visibility","classification","authority","contentHash","createdByUserId") VALUES (${documentId},${input.organizationId ?? null},${input.collectionId},${input.title},${input.sourceType ?? "TEXT"},'INDEXING',${visibility},${classification},${authority},${contentHash},${input.userId ?? input.principalId})`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeDocumentVersion" ("id","organizationId","documentId","version","sourceHash","normalizedHash","content","status","reviewStatus","createdByUserId") VALUES (${versionId},${input.organizationId ?? null},${documentId},1,${sha(input.content)},${contentHash},${content},'INDEXING','DRAFT',${input.userId ?? input.principalId})`);
    for (let i=0;i<chunks.length;i++) await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeChunk" ("id","organizationId","collectionId","documentId","documentVersionId","ordinal","content","contentHash","location","classification","visibility","allowedRoles","allowedUsers","allowedTeams","projectId","assessmentId","permissionVersion","authority","embeddingModel","embeddingVersion") VALUES (${`knc_${randomUUID().replaceAll("-","")}`},${input.organizationId ?? null},${input.collectionId},${documentId},${versionId},${i},${chunks[i]},${sha(chunks[i])},${`chunk:${i+1}`},${classification},${visibility},${JSON.stringify(input.allowedRoles ?? [])}::jsonb,${JSON.stringify(input.allowedUsers ?? [])}::jsonb,'[]'::jsonb,${input.projectId ?? null},${input.assessmentId ?? null},1,${authority},'lexical-v1','1')`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocumentVersion" SET status='ACTIVE' WHERE id=${versionId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocument" SET status='ACTIVE',"currentVersionId"=${versionId},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${documentId}`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeIngestionJob" ("id","organizationId","documentId","documentVersionId","idempotencyKey","correlationId","status","createdByUserId") VALUES (${jobId},${input.organizationId ?? null},${documentId},${versionId},${input.idempotencyKey},${correlationId},'ACTIVE',${input.userId ?? input.principalId}) ON CONFLICT ("organizationId","idempotencyKey") DO NOTHING`);
  });
  await db.auditEvent.create({ data: { organizationId: input.organizationId ?? null, actorUserId: input.userId ?? null, action: "M10_KNOWLEDGE_INGESTED", resourceType: "KnowledgeDocument", resourceId: documentId, requestId: input.requestId, metadata: { versionId, chunkCount: chunks.length, contentHash, classification, visibility, authority } } });
  return { id: documentId, versionId, chunkCount: chunks.length, contentHash };
}

export async function revokeDocument(input: KnowledgePrincipal & { documentId: string }) {
  if (!(await humanPermission(input, "knowledge:delete"))) throw new Error("knowledge_delete_denied");
  await db.$transaction(async (tx) => { await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocument" SET status='REVOKED',"revokedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${input.documentId} AND "organizationId"=${input.organizationId}`); await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeChunk" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`); await tx.$executeRaw(Prisma.sql`UPDATE "KnowledgeDocumentVersion" SET status='REVOKED' WHERE "documentId"=${input.documentId} AND "organizationId"=${input.organizationId}`); });
}

export async function retrieveKnowledge(input: KnowledgePrincipal & { query: string; projectId?: string; assessmentId?: string; maxResults?: number; maxClassification?: KnowledgeClassification }) {
  const started = Date.now(); const query = normalize(input.query); if (!query || query.length > 2000) throw new Error("invalid_knowledge_query");
  const auth = await authorizeRead(input, input.maxClassification ?? "CONFIDENTIAL"); if (!auth.ok) { await db.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeAccessEvent" ("id","organizationId","principalId","principalType","agentId","action","resourceType","decision","reasonCode","requestId") VALUES (${randomUUID()},${input.organizationId ?? null},${input.principalId},${input.principalType},${input.agentId ?? null},'READ','Knowledge','DENY',${auth.reason},${input.requestId})`); throw new Error("knowledge_access_denied"); }
  const max = Math.min(Math.max(input.maxResults ?? 10,1),MAX_RESULTS); const queryHash = hashSensitive(query);
  const rows = await db.$queryRaw<Array<{ id:string; organizationId:string|null; documentId:string; documentVersionId:string; title:string; content:string; location:string|null; classification:KnowledgeClassification; visibility:KnowledgeVisibility; authority:KnowledgeAuthority; projectId:string|null; assessmentId:string|null; allowedRoles:unknown; allowedUsers:unknown; rank:number }>>(Prisma.sql`SELECT c.id,c."organizationId",c."documentId",c."documentVersionId",d.title,c.content,c.location,c.classification,c.visibility,c.authority,c."projectId",c."assessmentId",c."allowedRoles",c."allowedUsers",ts_rank_cd(c."searchVector", plainto_tsquery('simple', ${query})) AS rank FROM "KnowledgeChunk" c JOIN "KnowledgeDocument" d ON d.id=c."documentId" AND d.status='ACTIVE' JOIN "KnowledgeDocumentVersion" v ON v.id=c."documentVersionId" AND v.status='ACTIVE' JOIN "KnowledgeCollection" col ON col.id=c."collectionId" AND col.status='ACTIVE' WHERE c.status='ACTIVE' AND (c.visibility IN ('PUBLIC','PLATFORM_INTERNAL') OR c."organizationId"=${input.organizationId ?? null}) AND (c."visibility"<>'PLATFORM_INTERNAL' OR EXISTS (SELECT 1 FROM "User" u WHERE u.id=${input.userId ?? ''} AND u.role IN ('admin','super-admin'))) AND (c."visibility"<>'USER_PRIVATE' OR ${input.userId ?? ''}=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedUsers")))) AND (c."allowedUsers"='[]'::jsonb OR ${input.userId ?? ''}=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedUsers")))) AND (c."allowedRoles"='[]'::jsonb OR EXISTS (SELECT 1 FROM "Member" m WHERE m."organizationId"=${input.organizationId ?? null} AND m."userId"=${input.userId ?? ''} AND m.role=ANY(ARRAY(SELECT jsonb_array_elements_text(c."allowedRoles"))))) AND (${input.projectId ?? null} IS NULL OR c."projectId"=${input.projectId ?? null}) AND (${input.assessmentId ?? null} IS NULL OR c."assessmentId"=${input.assessmentId ?? null}) AND c.classification IN ('PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED') AND classification_rank(c.classification) <= classification_rank(${input.maxClassification ?? "CONFIDENTIAL"}) AND plainto_tsquery('simple', ${query}) @@ c."searchVector" ORDER BY rank DESC,c."createdAt" DESC LIMIT ${max}`);
  const retrievalId = `knr_${randomUUID().replaceAll("-", "")}`; const latencyMs = Date.now()-started;
  await db.$transaction(async (tx) => { await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeRetrieval" ("id","organizationId","principalId","principalType","agentId","queryHash","scope","candidateCount","authorizedCandidateCount","selectedCount","method","latencyMs") VALUES (${retrievalId},${input.organizationId ?? null},${input.principalId},${input.principalType},${input.agentId ?? null},${queryHash},${JSON.stringify({projectId:input.projectId??null,assessmentId:input.assessmentId??null})}::jsonb,${rows.length},${rows.length},${rows.length},'LEXICAL',${latencyMs})`); for(let i=0;i<rows.length;i++) await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeCitation" ("id","retrievalId","chunkId","documentId","documentVersionId","rank","title","location","contentHash") VALUES (${randomUUID()},${retrievalId},${rows[i].id},${rows[i].documentId},${rows[i].documentVersionId},${i+1},${rows[i].title},${rows[i].location},${sha(rows[i].content)})`); await tx.$executeRaw(Prisma.sql`INSERT INTO "KnowledgeAccessEvent" ("id","organizationId","principalId","principalType","agentId","action","resourceType","resourceId","retrievalId","decision","reasonCode","requestId","metadata") VALUES (${randomUUID()},${input.organizationId ?? null},${input.principalId},${input.principalType},${input.agentId ?? null},'READ','Knowledge',${retrievalId},${retrievalId},'ALLOW','POLICY_ALLOWED',${input.requestId},${JSON.stringify({selected:rows.length,queryHash})}::jsonb)`); });
  return { retrievalId, method: "LEXICAL", results: rows.map((r,i)=>({ rank:i+1, documentId:r.documentId, documentVersionId:r.documentVersionId, title:r.title, location:r.location, authority:r.authority, classification:r.classification, content:r.content, citation:{ title:r.title, location:r.location, version:r.documentVersionId } })), supported: rows.length>0 };
}

export function buildGroundedContext(results: Awaited<ReturnType<typeof retrieveKnowledge>>["results"]) { return results.map((r)=>`<authorized-knowledge source="${r.documentId}" version="${r.documentVersionId}" location="${r.location ?? "unknown"}">\n${r.content}\n</authorized-knowledge>`).join("\n\n"); }
