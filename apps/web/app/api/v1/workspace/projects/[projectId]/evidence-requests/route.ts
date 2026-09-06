import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ title: z.string().trim().min(3).max(240), description: z.string().trim().min(10).max(10000), requestedType: z.string().trim().min(2).max(100), dueDate: z.string().datetime().optional(), assessmentId: z.string().optional() });

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "evidence:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const requests = await db.workspaceEvidenceRequest.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, orderBy: { dueDate: "asc" }, take: 100 });
  return NextResponse.json({ requests, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "workspace:manage");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (parsed.data.assessmentId) { const assessment = await db.workspaceAssessment.findFirst({ where: { id: parsed.data.assessmentId, projectId, organizationId: authorized.project.organizationId }, select: { id: true } }); if (!assessment) return NextResponse.json({ error: "assessment_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  const created = await db.$transaction(async (tx) => {
    const item = await tx.workspaceEvidenceRequest.create({ data: { organizationId: authorized.project.organizationId, projectId, assessmentId: parsed.data.assessmentId || null, title: parsed.data.title, description: parsed.data.description, requestedType: parsed.data.requestedType, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null, requestedByUserId: authorized.principal.userId } });
    await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "EVIDENCE_REQUESTED", resourceType: "workspace_evidence_request", resourceId: item.id, requestId, metadata: { projectId, requestedType: item.requestedType } } });
    return item;
  });
  return NextResponse.json({ status: "created", requestId, evidenceRequestId: created.id }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
