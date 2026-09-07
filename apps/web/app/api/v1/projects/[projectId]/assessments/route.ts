import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApi, bodyHash, cursorPage, emitApiEvent, ok, parsePagination, problem } from "@/lib/api/v1";

const schema = z.object({ type: z.enum(["cybersecurity","finance","healthtech","logistics","legal","revops","procurement","custom"]), objective: z.string().trim().min(10).max(5000), scope: z.record(z.string(), z.unknown()).default({}), methodology: z.string().trim().min(10).max(10000), version: z.string().trim().min(1).max(30).default("1.0") }).strict();
function encodeCursor(value: { createdAt: string; id: string }) { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function decodeCursor(value: string | null) { if (!value) return null; try { const x = JSON.parse(Buffer.from(value, "base64url").toString("utf8")); return x && typeof x.createdAt === "string" && typeof x.id === "string" ? x : null; } catch { return null; } }

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateApi(request, "assessments:read"); if ("response" in auth) return auth.response; const { projectId } = await context.params; const { limit, cursor } = parsePagination(request); const decoded = decodeCursor(cursor);
  const project = await db.project.findFirst({ where: { id: projectId, organizationId: auth.principal.organizationId }, select: { id: true } }); if (!project) return problem(auth.principal.requestId, 404, "resource_not_found", "Project not found");
  const rows = await db.workspaceAssessment.findMany({ where: { projectId, organizationId: auth.principal.organizationId, ...(decoded ? { OR: [{ createdAt: { lt: new Date(decoded.createdAt) } }, { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } }] } : {}) }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: limit + 1, select: { id: true, projectId: true, assessmentId: true, type: true, objective: true, scope: true, methodology: true, status: true, resultStatus: true, version: true, startedAt: true, completedAt: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > limit; const data = rows.slice(0, limit); const nextCursor = hasMore && data.length ? encodeCursor({ createdAt: data[data.length - 1].createdAt.toISOString(), id: data[data.length - 1].id }) : null; return cursorPage(request, data, nextCursor, hasMore);
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateApi(request, "assessments:write"); if ("response" in auth) return auth.response; const { projectId } = await context.params;
  const project = await db.project.findFirst({ where: { id: projectId, organizationId: auth.principal.organizationId }, select: { id: true, name: true } }); if (!project) return problem(auth.principal.requestId, 404, "resource_not_found", "Project not found");
  const key = request.headers.get("idempotency-key")?.trim(); if (!key || key.length > 255) return problem(auth.principal.requestId, 400, "idempotency_required", "Idempotency-Key is required for assessment creation");
  let body; try { body = schema.parse(await request.json()); } catch { return problem(auth.principal.requestId, 422, "validation_failed", "Invalid assessment request"); }
  const path = new URL(request.url).pathname; const requestHash = bodyHash(body);
  const existing = await db.$queryRaw<Array<{ requestHash: string; statusCode: number; responseBody: unknown; expiresAt: Date }>>(Prisma.sql`SELECT "requestHash","statusCode","responseBody","expiresAt" FROM "ApiIdempotencyKey" WHERE "organizationId"=${auth.principal.organizationId} AND "key"=${key} AND "method"='POST' AND "path"=${path} AND "expiresAt">CURRENT_TIMESTAMP LIMIT 1`);
  if (existing[0]) { if (existing[0].requestHash !== requestHash) return problem(auth.principal.requestId, 409, "idempotency_conflict", "Idempotency key was already used with a different request"); return new Response(JSON.stringify(existing[0].responseBody), { status: existing[0].statusCode, headers: { "content-type": "application/json", "cache-control": "private, no-store", "x-request-id": auth.principal.requestId } }); }
  const actor = await db.user.findUnique({ where: { id: auth.principal.userId }, select: { name: true, email: true } }); const org = await db.organization.findUnique({ where: { id: auth.principal.organizationId }, select: { name: true } });
  if (!actor || !org) return problem(auth.principal.requestId, 503, "service_unavailable", "Organization context unavailable");
  const responseBody = await db.$transaction(async (tx) => {
    const lead = await tx.lead.create({ data: { organizationId: auth.principal.organizationId, organizationName: org.name, contactName: actor.name, email: actor.email, country: "API", service: "security-assessment", problemStatement: body.objective, desiredOutcome: body.objective, technicalEnvironment: JSON.stringify(body.scope), securitySensitivity: "customer-api", consent: true, source: "api-v1" } });
    const assessment = await tx.assessment.create({ data: { organizationId: auth.principal.organizationId, leadId: lead.id, problem: body.objective, desiredOutcome: body.objective, existingSystems: JSON.stringify(body.scope), securityRequirements: body.methodology, status: "submitted", idempotencyKey: `api:${auth.principal.organizationId}:${key}` } });
    const workspace = await tx.workspaceAssessment.create({ data: { projectId, organizationId: auth.principal.organizationId, assessmentId: assessment.id, type: body.type, objective: body.objective, scope: body.scope as Prisma.InputJsonValue, methodology: body.methodology, status: "SCOPED", assessorUserId: auth.principal.userId, version: body.version } });
    await tx.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "ASSESSMENT_CREATED", resourceType: "workspace_assessment", resourceId: workspace.id, requestId: auth.principal.requestId, metadata: { apiVersion: "v1", projectId, source: "api" } } });
    const eventId = await emitApiEvent(tx, { organizationId: auth.principal.organizationId, type: "assessment.created", resourceType: "assessment", resourceId: workspace.id, data: { id: workspace.id, projectId, type: body.type, status: workspace.status } });
    return { id: workspace.id, projectId, assessmentId: assessment.id, type: workspace.type, status: workspace.status, resultStatus: workspace.resultStatus, createdAt: workspace.createdAt, updatedAt: workspace.updatedAt, eventId };
  });
  const envelope = { data: responseBody, requestId: auth.principal.requestId };
  try { await db.$executeRaw(Prisma.sql`INSERT INTO "ApiIdempotencyKey" ("id","organizationId","credentialId","key","method","path","requestHash","statusCode","responseBody","createdAt","expiresAt") VALUES (${`idem_${createHash("sha256").update(`${auth.principal.organizationId}:${key}:${path}`).digest("hex")}`},${auth.principal.organizationId},${auth.principal.credentialId},${key},'POST',${path},${requestHash},201,${JSON.stringify(envelope)}::jsonb,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP + INTERVAL '24 hours')`); } catch (error) { console.error("api_idempotency_persist_failed", { requestId: auth.principal.requestId, error }); }
  return ok(request, responseBody, 201);
}
