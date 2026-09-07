import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

const patchSchema = z.object({ name: z.string().trim().min(1).max(200).optional(), type: z.string().trim().max(100).nullable().optional(), description: z.string().trim().max(5000).nullable().optional(), dueAt: z.string().datetime().nullable().optional() }).strict();
function etag(updatedAt: Date) { return `\"${updatedAt.getTime().toString(16)}\"`; }

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateApi(request, "projects:read"); if ("response" in auth) return auth.response; const { projectId } = await context.params;
  const project = await db.project.findFirst({ where: { id: projectId, organizationId: auth.principal.organizationId }, select: { id: true, name: true, type: true, status: true, progress: true, nextDecision: true, dueAt: true, description: true, createdAt: true, updatedAt: true } });
  if (!project) return problem(auth.principal.requestId, 404, "resource_not_found", "Project not found");
  return ok(request, project, 200, { etag: etag(project.updatedAt) });
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const auth = await authenticateApi(request, "projects:write"); if ("response" in auth) return auth.response; const { projectId } = await context.params;
  const project = await db.project.findFirst({ where: { id: projectId, organizationId: auth.principal.organizationId }, select: { id: true, updatedAt: true } });
  if (!project) return problem(auth.principal.requestId, 404, "resource_not_found", "Project not found");
  const ifMatch = request.headers.get("if-match"); if (ifMatch && ifMatch !== etag(project.updatedAt) && ifMatch !== "*") return problem(auth.principal.requestId, 412, "precondition_failed", "Project changed", "Refresh the resource and retry with its current ETag.");
  let body; try { body = patchSchema.parse(await request.json()); } catch { return problem(auth.principal.requestId, 422, "validation_failed", "Invalid project update"); }
  const updated = await db.$transaction(async (tx) => {
    const value = await tx.project.update({ where: { id: projectId }, data: { ...(body.name !== undefined ? { name: body.name } : {}), ...(body.type !== undefined ? { type: body.type } : {}), ...(body.description !== undefined ? { description: body.description } : {}), ...(body.dueAt !== undefined ? { dueAt: body.dueAt ? new Date(body.dueAt) : null } : {}) } });
    await tx.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "PROJECT_UPDATED", resourceType: "project", resourceId: projectId, requestId: auth.principal.requestId, metadata: { fields: Object.keys(body) } } });
    return value;
  });
  return ok(request, { id: updated.id, name: updated.name, type: updated.type, status: updated.status, description: updated.description, dueAt: updated.dueAt, updatedAt: updated.updatedAt }, 200, { etag: etag(updated.updatedAt) });
}
