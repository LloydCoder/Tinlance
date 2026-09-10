import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { enforceSecurity, buildPrincipal } from "@/lib/security-gateway";

export const M13_POLICY_VERSION = "m13-policy-v1";
export const M13_TRANSFORMATION_VERSION = "m13-deterministic-deid-v1";
const MIN_PUBLIC_COHORT = 5;
const MAX_SOURCE_TEXT = 200_000;

export type M13Classification = "PUBLIC" | "INTERNAL" | "CUSTOMER_CONFIDENTIAL" | "CUSTOMER_RESTRICTED" | "PERSONAL_DATA" | "SENSITIVE_PERSONAL_DATA" | "SECRET" | "CREDENTIAL" | "SECURITY_SENSITIVE" | "LEGALLY_RESTRICTED" | "DERIVED_INTELLIGENCE" | "APPROVED_PUBLIC_INTELLIGENCE";
export type M13Status = "CANDIDATE" | "ELIGIBILITY_REVIEW" | "MINIMIZATION_REQUIRED" | "DE_IDENTIFICATION" | "RISK_REVIEW" | "HUMAN_REVIEW" | "APPROVED_INTERNAL" | "APPROVED_LIMITED" | "APPROVED_PUBLIC" | "PUBLISHED" | "REJECTED" | "REVOKED" | "EXPIRED" | "SUPERSEDED" | "REQUIRES_REVIEW";
export type M13Scope = "INTERNAL" | "LIMITED" | "PUBLIC" | "CUSTOMER_SAFE";

type Principal = { userId: string; organizationId: string; requestId: string };

export function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }

const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:ghp|github_pat|xox[baprs]|sk-[A-Za-z0-9_-]{12,})[A-Za-z0-9_-]*\b/i,
  /\b(?:api[_-]?key|secret|password|passwd|token|authorization)\s*[:=]\s*[^\s,;]{8,}/i,
  /\bBearer\s+[A-Za-z0-9._~+\-/]+=*/i,
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s]+/i,
];
const PII_PATTERNS: Array<[string, RegExp]> = [
  ["EMAIL", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ["PHONE", /\b(?:\+?\d[\d .()/-]{8,}\d)\b/],
  ["IP_ADDRESS", /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ["PRIVATE_URL", /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)[^\s]*/i],
  ["PERSON_NAME", /\b(?:customer|client|employee|contact|person)\s*(?:name)?\s*[:=]\s*[A-Z][A-Za-z'’-]{2,}(?:\s+[A-Z][A-Za-z'’-]{2,})?/i],
];

export function detectSensitive(text: string) {
  const secrets = SECRET_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  const pii = PII_PATTERNS.filter(([, p]) => p.test(text)).map(([name]) => name);
  return { secret: secrets.length > 0, pii, secretSignals: secrets.length };
}

function generalizeTechnology(text: string) {
  return text
    .replace(/\b(?:aws|amazon web services|azure|gcp|google cloud)\b/gi, "major cloud provider")
    .replace(/\b(?:postgres(?:ql)?|mysql|mariadb|mongodb|redis|dynamodb)\b/gi, "managed relational/document datastore")
    .replace(/\b(?:kubernetes|k8s|docker|ecs|eks|aks|gke)\b/gi, "container orchestration platform")
    .replace(/\b(?:openai|anthropic|gemini|llama|mistral)\b/gi, "foundation model provider")
    .replace(/\b(?:langchain|langgraph|llamaindex|semantic kernel)\b/gi, "agent/RAG framework");
}

export function minimizeAndDeidentify(text: string) {
  if (text.length > MAX_SOURCE_TEXT) throw new Error("m13_source_too_large");
  const before = detectSensitive(text);
  if (before.secret) throw new Error("m13_secret_detected");
  let output = text.normalize("NFKC").replace(/[\u0000-\u001F\u007F]/g, " ");
  output = output.replace(PII_PATTERNS[0][1], "[EMAIL_REMOVED]");
  output = output.replace(PII_PATTERNS[1][1], "[PHONE_REMOVED]");
  output = output.replace(PII_PATTERNS[2][1], "[NETWORK_IDENTIFIER_REMOVED]");
  output = output.replace(PII_PATTERNS[3][1], "[PRIVATE_ENDPOINT_REMOVED]");
  output = output.replace(PII_PATTERNS[4][1], "[PERSON_IDENTIFIER_REMOVED]");
  output = output.replace(/\b(?:Company|Customer|Client)\s+[A-Z][A-Za-z0-9._-]{2,}\b/g, "the assessed organization");
  output = output.replace(/\b(?:Amsterdam|Berlin|London|Paris|Lagos|Onitsha|New York|San Francisco)\b/gi, "the relevant region");
  output = output.replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi, "the observed period");
  output = generalizeTechnology(output).replace(/\s+/g, " ").trim();
  const after = detectSensitive(output);
  if (after.secret || after.pii.length > 0) throw new Error("m13_deidentification_failed");
  return { content: output, removed: [...before.pii], transformationVersion: M13_TRANSFORMATION_VERSION };
}

function riskFor(content: string, sourceCount = 1) {
  const signals: string[] = [];
  let score = 0;
  if (sourceCount < MIN_PUBLIC_COHORT) { score += 30; signals.push("small_cohort"); }
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  if (sentences.some((s) => s.length > 180)) { score += 10; signals.push("high_specificity"); }
  if (/\b(?:zero-day|0-day|CVE-\d{4}-\d+|incident|breach|outage)\b/i.test(content)) { score += 25; signals.push("security_event"); }
  if (/\b(?:blockchain|rare protocol|proprietary|custom hardware|unique stack)\b/i.test(content)) { score += 20; signals.push("rare_technology"); }
  if (/\b(?:one|single|only)\b/i.test(content)) { score += 10; signals.push("uniqueness_language"); }
  score = Math.min(100, score);
  const riskLevel = score >= 75 ? "CRITICAL" : score >= 50 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
  return { score, riskLevel, signals } as const;
}

async function m7(principal: Principal, action: string, classification: M13Classification) {
  const decision = await enforceSecurity({
    principal: buildPrincipal({ principalId: principal.userId, principalType: "HUMAN", organizationId: principal.organizationId, userId: principal.userId }),
    action,
    resourceType: "M13Intelligence",
    dataClassification: classification,
    context: { tenantId: principal.organizationId, m13PolicyVersion: M13_POLICY_VERSION },
    requestId: principal.requestId,
  });
  if (decision.decision !== "ALLOW") throw new Error("m13_policy_denied");
}

async function audit(principal: Principal, action: string, resourceId: string, metadata: Record<string, unknown> = {}) {
  await db.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action, resourceType: "M13Intelligence", resourceId, requestId: principal.requestId, metadata } });
}

export async function createCandidate(principal: Principal & { engagementId: string; category: string; content: string; purpose?: string; contractualBasis?: string; aggregationAllowed?: boolean; commercialReuseAllowed?: boolean }) {
  await m7(principal, "m13.source.create", "CUSTOMER_RESTRICTED");
  const engagement = await db.$queryRaw<Array<{ id: string; organizationId: string }>>(Prisma.sql`SELECT id,"organizationId" FROM "Engagement" WHERE id=${principal.engagementId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  if (!engagement[0]) throw new Error("m13_source_not_found");
  if (!principal.contractualBasis || !principal.purpose) throw new Error("m13_permission_required");
  const transformed = minimizeAndDeidentify(principal.content);
  const risk = riskFor(transformed.content, 1);
  const sourceId = `mis_${randomUUID().replaceAll("-", "")}`;
  const candidateId = `mic_${randomUUID().replaceAll("-", "")}`;
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "IntelligenceSource" ("id","organizationId","engagementId","sourceType","provenance","classification","contractualBasis","permittedPurpose","allowedAudience","allowedDestinations","customerApprovalRequired","commercialReuseAllowed","aggregationAllowed","status","createdByUserId") VALUES (${sourceId},${principal.organizationId},${principal.engagementId},'M3_DERIVED_REFERENCE',${JSON.stringify({ sourceSystem: "M3", transformation: M13_TRANSFORMATION_VERSION, policy: M13_POLICY_VERSION })}::jsonb,'CUSTOMER_RESTRICTED',${principal.contractualBasis},${principal.purpose},'[]'::jsonb,'[]'::jsonb,TRUE,${principal.commercialReuseAllowed ?? false},${principal.aggregationAllowed ?? false},'ELIGIBLE',${principal.userId})`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "IntelligenceCandidate" ("id","organizationId","sourceId","category","minimizedContent","contentHash","classification","status","riskLevel","riskScore","riskFactors","evidenceCount","confidence","observationType","createdByUserId") VALUES (${candidateId},${principal.organizationId},${sourceId},${principal.category},${transformed.content},${sha256(transformed.content)},'DERIVED_INTELLIGENCE','HUMAN_REVIEW',${risk.riskLevel},${risk.score},${JSON.stringify(risk.signals)}::jsonb,1,0.5,'OBSERVED',${principal.userId})`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "IntelligenceEvidence" ("id","organizationId","candidateId","sourceReference","evidenceHash","evidenceType","provenance") VALUES (${`mie_${randomUUID().replaceAll("-", "")}`},${principal.organizationId},${candidateId},${`m3:engagement:${principal.engagementId}`},${sha256(transformed.content)},'DERIVED_OBSERVATION',${JSON.stringify({ transformation: M13_TRANSFORMATION_VERSION })}::jsonb)`);
  });
  await audit(principal, "M13_CANDIDATE_CREATED", candidateId, { sourceId, risk: risk.riskLevel, transformationVersion: M13_TRANSFORMATION_VERSION });
  return { candidateId, sourceId, status: "HUMAN_REVIEW" as const, risk };
}

export async function reviewCandidate(principal: Principal & { candidateId: string; decision: "APPROVE" | "REJECT"; scope?: M13Scope; purpose?: string; destination?: string[] }) {
  await m7(principal, "m13.review", "DERIVED_INTELLIGENCE");
  const rows = await db.$queryRaw<Array<{ id: string; organizationId: string; version: number; content: string; contentHash: string; status: M13Status; riskLevel: string; sourceId: string }>>(Prisma.sql`SELECT id,"organizationId",version,"minimizedContent" AS content,"contentHash",status,"riskLevel","sourceId" FROM "IntelligenceCandidate" WHERE id=${principal.candidateId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  const candidate = rows[0];
  if (!candidate) throw new Error("m13_candidate_not_found");
  if (!["HUMAN_REVIEW", "RISK_REVIEW", "ELIGIBILITY_REVIEW"].includes(candidate.status)) throw new Error("m13_invalid_review_state");
  const scope = principal.scope ?? "INTERNAL";
  if (principal.decision === "APPROVE" && scope === "PUBLIC") {
    if (candidate.riskLevel === "HIGH" || candidate.riskLevel === "CRITICAL") throw new Error("m13_public_risk_blocked");
    const source = await db.$queryRaw<Array<{ contractualBasis: string | null; commercialReuseAllowed: boolean; customerApprovalRequired: boolean }>>(Prisma.sql`SELECT "contractualBasis","commercialReuseAllowed","customerApprovalRequired" FROM "IntelligenceSource" WHERE id=${candidate.sourceId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
    if (!source[0]?.contractualBasis || !source[0].commercialReuseAllowed) throw new Error("m13_public_permission_denied");
    const evidence = await db.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM "IntelligenceEvidence" WHERE "candidateId"=${candidate.id} AND "organizationId"=${principal.organizationId}`);
    if (Number(evidence[0]?.count ?? 0) < MIN_PUBLIC_COHORT) throw new Error("m13_public_cohort_too_small");
  }
  const decision = principal.decision === "APPROVE" ? (scope === "PUBLIC" ? "APPROVED_PUBLIC" : scope === "LIMITED" || scope === "CUSTOMER_SAFE" ? "APPROVED_LIMITED" : "APPROVED_INTERNAL") : "REJECTED";
  const approvalId = `mia_${randomUUID().replaceAll("-", "")}`;
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`UPDATE "IntelligenceCandidate" SET status=${decision},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${candidate.id} AND "organizationId"=${principal.organizationId} AND version=${candidate.version}`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "IntelligenceApproval" ("id","organizationId","candidateId","candidateVersion","contentHash","transformationVersion","decision","scope","audience","purpose","destination","policyVersion","reviewerUserId") VALUES (${approvalId},${principal.organizationId},${candidate.id},${candidate.version},${candidate.contentHash},${M13_TRANSFORMATION_VERSION},${principal.decision === "APPROVE" ? "APPROVED" : "REJECTED"},${scope},${JSON.stringify(scope === "PUBLIC" ? ["PUBLIC"] : ["TINLANCE"])}::jsonb,${principal.purpose ?? "governed organizational intelligence"},${JSON.stringify(principal.destination ?? [])}::jsonb,${M13_POLICY_VERSION},${principal.userId})`);
  });
  await audit(principal, principal.decision === "APPROVE" ? "M13_APPROVED" : "M13_REJECTED", candidate.id, { version: candidate.version, contentHash: candidate.contentHash, scope, approvalId });
  return { candidateId: candidate.id, version: candidate.version, decision, approvalId };
}

export async function publishCandidate(principal: Principal & { candidateId: string; destination: "M10" | "M11" | "M12" }) {
  await m7(principal, "m13.publish", "DERIVED_INTELLIGENCE");
  const rows = await db.$queryRaw<Array<{ id: string; version: number; contentHash: string; status: M13Status; riskLevel: string }>>(Prisma.sql`SELECT id,version,"contentHash",status,"riskLevel" FROM "IntelligenceCandidate" WHERE id=${principal.candidateId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  const candidate = rows[0];
  if (!candidate) throw new Error("m13_candidate_not_found");
  const scope = candidate.status === "APPROVED_PUBLIC" ? "PUBLIC" : candidate.status === "APPROVED_LIMITED" ? "LIMITED" : candidate.status === "APPROVED_INTERNAL" ? "INTERNAL" : null;
  if (!scope) throw new Error("m13_not_approved");
  if (principal.destination === "M11" && scope !== "PUBLIC") throw new Error("m13_m11_public_only");
  if (candidate.riskLevel === "HIGH" || candidate.riskLevel === "CRITICAL") throw new Error("m13_high_risk_publish_blocked");
  const approval = await db.$queryRaw<Array<{ id: string; candidateVersion: number; contentHash: string; decision: string; scope: string; expiresAt: Date | null }>>(Prisma.sql`SELECT id,"candidateVersion","contentHash",decision,scope,"expiresAt" FROM "IntelligenceApproval" WHERE "candidateId"=${candidate.id} AND "organizationId"=${principal.organizationId} ORDER BY "createdAt" DESC LIMIT 1`);
  if (!approval[0] || approval[0].decision !== "APPROVED" || approval[0].candidateVersion !== candidate.version || approval[0].contentHash !== candidate.contentHash || approval[0].scope !== scope || (approval[0].expiresAt && approval[0].expiresAt <= new Date())) throw new Error("m13_approval_invalid");
  const publicationId = `mip_${randomUUID().replaceAll("-", "")}`;
  await db.$executeRaw(Prisma.sql`INSERT INTO "IntelligencePublication" ("id","organizationId","candidateId","candidateVersion","contentHash","destination","visibility","publishedVersion","approvalId") VALUES (${publicationId},${principal.organizationId},${candidate.id},${candidate.version},${candidate.contentHash},${principal.destination},${scope},${candidate.version},${approval[0].id})`);
  await audit(principal, "M13_PUBLISHED", candidate.id, { publicationId, destination: principal.destination, version: candidate.version, scope });
  return { publicationId, destination: principal.destination, version: candidate.version, scope };
}

export async function revokeCandidate(principal: Principal & { candidateId: string; reason: string }) {
  await m7(principal, "m13.revoke", "DERIVED_INTELLIGENCE");
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`UPDATE "IntelligenceCandidate" SET status='REVOKED',"updatedAt"=CURRENT_TIMESTAMP WHERE id=${principal.candidateId} AND "organizationId"=${principal.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "IntelligencePublication" SET "revokedAt"=CURRENT_TIMESTAMP WHERE "candidateId"=${principal.candidateId} AND "organizationId"=${principal.organizationId} AND "revokedAt" IS NULL`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "IntelligenceRevocation" ("id","organizationId","candidateId","reason","actorUserId") VALUES (${`mir_${randomUUID().replaceAll("-", "")}`},${principal.organizationId},${principal.candidateId},${principal.reason},${principal.userId})`);
  });
  await audit(principal, "M13_REVOKED", principal.candidateId, { reason: principal.reason, downstreamInvalidation: ["M10","M11","M12"] });
  return { candidateId: principal.candidateId, status: "REVOKED" as const };
}

export async function listApprovedPublic(principal: Principal & { category?: string; limit?: number }) {
  const max = Math.min(Math.max(principal.limit ?? 20, 1), 50);
  const rows = await db.$queryRaw<Array<{ id: string; category: string; content: string; contentHash: string; version: number }>>(Prisma.sql`SELECT c.id,c.category,c."minimizedContent" AS content,c."contentHash",c.version FROM "IntelligenceCandidate" c JOIN "IntelligencePublication" p ON p."candidateId"=c.id AND p."candidateVersion"=c.version AND p.destination='M11' AND p.visibility='PUBLIC' AND p."revokedAt" IS NULL JOIN "IntelligenceApproval" a ON a.id=p."approvalId" AND a.decision='APPROVED' AND a.scope='PUBLIC' WHERE c.status='APPROVED_PUBLIC' AND c."organizationId"=${principal.organizationId} AND (${principal.category ?? null} IS NULL OR c.category=${principal.category ?? null}) ORDER BY c."updatedAt" DESC LIMIT ${max}`);
  await audit(principal, "M13_PUBLIC_RETRIEVED", "public-corpus", { count: rows.length });
  return rows;
}
