import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApi, bodyHash, cursorPage, emitApiEvent, ok, parsePagination, problem } from "@/lib/api/v1";

const createSchema = z.object({ name: z.string().trim().min(1).max(200), type: z.string().trim().max(100).optional(), description: z.string().trim().max(5000).optional(), dueAt: z.string().datetime().optional() });
function encodeCursor(value: { createdAt: string; id: string }) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function decodeCursor(value: string | null) { if (!value) return null; try { const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")); return parsed && typeof parsed.createdAt === "string" && typeof parsed.id === "string" ? parsed : null; } catch { return null; } }

export async function GET(request: Request) {
  const auth = await authenticateApi(request, "projects:read"); if ("response" in auth) return auth.response; const { principal } = auth; const { limit, cursor } = parsePagination(request); const decoded = decodeCursor(cursor);
  const rows = await db.project.findMany({ where: { organizationId: principal.organizationId, ...(decoded ? { OR: [{ createdAt: { lt: new Date(decoded.createdAt) } }, { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } }] } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit + 1, select: { id: true, name: true, type: true, status: true, progress: true, nextDecision: true, dueAt: true, description: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > limit; const data = rows.slice(0, limit); const nextCursor = hasMore && data.length ? encodeCursor({ createdAt: data[data.length - 1].createdAt.toISOString(), id: data[data.length - 1].id }) : null; return cursorPage(request, data, nextCursor, hasMore);
}

export async function POST(request: Request) {
  const auth = await authenticateApi(request, "projects:write", "write"); if ("response" in auth) return auth.response; const { principal } = auth; const key = request.headers.get("idempotency-key")?.trim(); if (!key || key.length > 255) return problem(principal.requestId, 400, "idempotency_required", "Idempotency-Key is required for project creation");
  let body; try { body = createSchema.parse(await request.json()); } catch { return problem(principal.requestId, 422, "validation_failed", "Invalid project request"); }
  const path = new URL(request.url).pathname; const requestHash = bodyHash(body); const existing = await db.$queryRaw<Array<{ requestHash: string; statusCode: number; responseBody: unknown }>>(Prisma.sql`SELECT "requestHash","statusCode","responseBody" FROM "ApiIdempotencyKey" WHERE "organizationId"=${principal.organizationId} AND "key"=${key} AND "method"='POST' AND "path"=${path} AND "expiresAt">CURRENT_TIMESTAMP LIMIT 1`);
  if (existing[0]) { if (existing[0].requestHash !== requestHash) return problem(principal.requestId, 409, "idempotency_conflict", "Idempotency key was already used with a different request"); return new Response(JSON.stringify(existing[0].responseBody), { status: existing[0].statusCode, headers: { "content-type": "application/json", "cache-control": "private, no-store", "x-request-id": principal.requestId } }); }
  const project = await db.$transaction(async (tx) => {
    const created = await tx.project.create({ data: { organizationId: principal.organizationId, name: body.name, type: body.type, description: body.description, dueAt: body.dueAt ? new Date(body.dueAt) : undefined } });
    await tx.projectWorkspaceState.create({ data: { projectId: created.id, organizationId: principal.organizationId, status: "DRAFT", ownerUserId: principal.userId, updatedAt: new Date() } });
    await tx.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action: "PROJECT_CREATED", resourceType: "project", resourceId: created.id, requestId: principal.requestId, metadata: { apiVersion: "v1" } } });
    await emitApiEvent(tx, { organizationId: principal.organizationId, type: "project.created", resourceType: "project", resourceId: created.id, data: { id: created.id, name: created.name, type: created.type, status: created.status } });
    return created;
  });
  const envelope = { data: { id: project.id, name: project.name, type: project.type, status: project.status, description: project.description, createdAt: project.createdAt, updatedAt: project.updatedAt }, requestId: principal.requestId };
  try { await db.$executeRaw(Prisma.sql`INSERT INTO "ApiIdempotencyKey" ("id","organizationId","credentialId","key","method","path","requestHash","statusCode","responseBody","createdAt","expiresAt") VALUES (${`idem_${bodyHash(`${principal.organizationId}:${key}:${path}`).slice(0,48)}`},${principal.organizationId},${principal.credentialId},${key},'POST',${path},${requestHash},201,${JSON.stringify(envelope)}::jsonb,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP + INTERVAL '24 hours')`); } catch (error) { console.error("api_idempotency_persist_failed", { requestId: principal.requestId, error }); }
  return ok(request, envelope.data, 201);
}
