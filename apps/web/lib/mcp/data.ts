import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const MAX_LIMIT = 100;
type Cursor = { createdAt: string; id: string };
function decodeCursor(cursor?: string): Cursor | null {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<Cursor>;
    if (typeof value.createdAt !== "string" || typeof value.id !== "string" || value.id.length > 128) return null;
    const createdAt = new Date(value.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt: createdAt.toISOString(), id: value.id };
  } catch { return null; }
}
function encodeCursor(createdAt: Date, id: string) { return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id }), "utf8").toString("base64url"); }
function page<T extends { createdAt: Date; id: string }>(rows: T[], limit: number) { const hasMore = rows.length > limit; const data = rows.slice(0, limit); const last = data.at(-1); return { data, hasMore, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null }; }

export async function listProjects(organizationId: string, limit = 25, cursor?: string) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const decoded = decodeCursor(cursor);
  if (cursor && !decoded) return { data: [], hasMore: false, nextCursor: null, invalidCursor: true };
  const rows = await db.$queryRaw<Array<{ id: string; name: string; type: string | null; status: string; description: string | null; progress: number; nextDecision: string | null; dueAt: Date | null; createdAt: Date; updatedAt: Date }>>(decoded
    ? Prisma.sql`SELECT "id","name","type","status","description","progress","nextDecision","dueAt","createdAt","updatedAt" FROM "Project" WHERE "organizationId"=${organizationId} AND ("createdAt","id") < (${new Date(decoded.createdAt)},${decoded.id}) ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`
    : Prisma.sql`SELECT "id","name","type","status","description","progress","nextDecision","dueAt","createdAt","updatedAt" FROM "Project" WHERE "organizationId"=${organizationId} ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`);
  const result = page(rows, safeLimit);
  return { ...result, data: result.data.map((row) => ({ ...row, dueAt: row.dueAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), invalidCursor: false };
}

export async function getProject(organizationId: string, projectId: string) {
  const rows = await db.$queryRaw<Array<{ id: string; name: string; type: string | null; status: string; description: string | null; progress: number; nextDecision: string | null; dueAt: Date | null; createdAt: Date; updatedAt: Date }>>(Prisma.sql`SELECT "id","name","type","status","description","progress","nextDecision","dueAt","createdAt","updatedAt" FROM "Project" WHERE "id"=${projectId} AND "organizationId"=${organizationId} LIMIT 1`);
  const row = rows[0];
  if (!row) return null;
  return { ...row, dueAt: row.dueAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export async function getAssessment(organizationId: string, assessmentId: string) {
  const rows = await db.$queryRaw<Array<{ id: string; projectId: string; assessmentId: string; type: string; objective: string; scope: unknown; methodology: string; status: string; resultStatus: string; version: string; startedAt: Date | null; completedAt: Date | null; createdAt: Date; updatedAt: Date }>>(Prisma.sql`SELECT "id","projectId","assessmentId","type","objective","scope","methodology","status","resultStatus","version","startedAt","completedAt","createdAt","updatedAt" FROM "WorkspaceAssessment" WHERE "id"=${assessmentId} AND "organizationId"=${organizationId} LIMIT 1`);
  const row = rows[0];
  if (!row) return null;
  return { ...row, startedAt: row.startedAt?.toISOString() ?? null, completedAt: row.completedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export async function listFindings(organizationId: string, projectId: string, limit = 25, cursor?: string) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const decoded = decodeCursor(cursor);
  if (cursor && !decoded) return { data: [], hasMore: false, nextCursor: null, invalidCursor: true };
  const rows = await db.$queryRaw<Array<{ id: string; projectId: string; assessmentId: string; title: string; description: string; category: string; severity: string; likelihood: string | null; impact: string | null; riskScore: unknown; status: string; affectedAsset: string | null; recommendation: string; dueDate: Date | null; visibility: string; authorship: string; createdAt: Date; updatedAt: Date }>>(decoded
    ? Prisma.sql`SELECT "id","projectId","assessmentId","title","description","category","severity","likelihood","impact","riskScore","status","affectedAsset","recommendation","dueDate","visibility","authorship","createdAt","updatedAt" FROM "WorkspaceFinding" WHERE "organizationId"=${organizationId} AND "projectId"=${projectId} AND "visibility" IN ('CUSTOMER','CUSTOMER_CONFIDENTIAL') AND ("createdAt","id") < (${new Date(decoded.createdAt)},${decoded.id}) ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`
    : Prisma.sql`SELECT "id","projectId","assessmentId","title","description","category","severity","likelihood","impact","riskScore","status","affectedAsset","recommendation","dueDate","visibility","authorship","createdAt","updatedAt" FROM "WorkspaceFinding" WHERE "organizationId"=${organizationId} AND "projectId"=${projectId} AND "visibility" IN ('CUSTOMER','CUSTOMER_CONFIDENTIAL') ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`);
  const result = page(rows, safeLimit);
  return { ...result, data: result.data.map((row) => ({ ...row, dueDate: row.dueDate?.toISOString() ?? null, riskScore: row.riskScore === null ? null : String(row.riskScore), createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), invalidCursor: false };
}

export async function getReport(organizationId: string, reportId: string) {
  const rows = await db.$queryRaw<Array<{ id: string; projectId: string; assessmentId: string | null; title: string; type: string; currentVersion: number; status: string; summary: string | null; generatedAt: Date | null; publishedAt: Date | null; contentHash: string | null; createdAt: Date; updatedAt: Date }>>(Prisma.sql`SELECT "id","projectId","assessmentId","title","type","currentVersion","status","summary","generatedAt","publishedAt","contentHash","createdAt","updatedAt" FROM "WorkspaceReport" WHERE "id"=${reportId} AND "organizationId"=${organizationId} AND "status" IN ('APPROVED','PUBLISHED','SUPERSEDED') LIMIT 1`);
  const row = rows[0];
  if (!row) return null;
  return { ...row, generatedAt: row.generatedAt?.toISOString() ?? null, publishedAt: row.publishedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export async function listRemediation(organizationId: string, projectId: string, limit = 25, cursor?: string) {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const decoded = decodeCursor(cursor);
  if (cursor && !decoded) return { data: [], hasMore: false, nextCursor: null, invalidCursor: true };
  const rows = await db.$queryRaw<Array<{ id: string; findingId: string; title: string; description: string; priority: string; status: string; targetDate: Date | null; completedAt: Date | null; verificationStatus: string; createdAt: Date; updatedAt: Date }>>(decoded
    ? Prisma.sql`SELECT "id","findingId","title","description","priority","status","targetDate","completedAt","verificationStatus","createdAt","updatedAt" FROM "WorkspaceRemediation" WHERE "organizationId"=${organizationId} AND "projectId"=${projectId} AND ("createdAt","id") < (${new Date(decoded.createdAt)},${decoded.id}) ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`
    : Prisma.sql`SELECT "id","findingId","title","description","priority","status","targetDate","completedAt","verificationStatus","createdAt","updatedAt" FROM "WorkspaceRemediation" WHERE "organizationId"=${organizationId} AND "projectId"=${projectId} ORDER BY "createdAt" DESC,"id" DESC LIMIT ${safeLimit + 1}`);
  const result = page(rows, safeLimit);
  return { ...result, data: result.data.map((row) => ({ ...row, targetDate: row.targetDate?.toISOString() ?? null, completedAt: row.completedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() })), invalidCursor: false };
}
