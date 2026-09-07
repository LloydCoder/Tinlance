import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ assessmentId: z.string().min(1).max(100), type: z.enum(["cybersecurity","finance","healthtech","logistics","legal","revops","procurement","custom"]), objective: z.string().trim().min(10).max(5000), scope: z.record(z.string(), z.unknown()), methodology: z.string().trim().min(10).max(10000), version: z.string().trim().min(1).max(30).default("1.0") });

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "assessment:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const assessments = await db.workspaceAssessment.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ assessments, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "assessment:create");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const sourceAssessment = await db.assessment.findFirst({ where: { id: parsed.data.assessmentId, organizationId: authorized.project.organizationId }, select: { id: true } });
  if (!sourceAssessment) return NextResponse.json({ error: "assessment_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const existing = await db.workspaceAssessment.findUnique({ where: { assessmentId: sourceAssessment.id }, select: { id: true, projectId: true } });
  if (existing) return NextResponse.json({ status: existing.projectId === projectId ? "already_exists" : "assessment_already_bound", assessmentId: existing.id, projectId: existing.projectId, requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const scope = parsed.data.scope as Prisma.InputJsonValue;
  try {
    const assessment = await db.$transaction(async (tx) => {
      const created = await tx.workspaceAssessment.create({ data: { projectId, organizationId: authorized.project.organizationId, assessmentId: sourceAssessment.id, type: parsed.data.type, objective: parsed.data.objective, scope, methodology: parsed.data.methodology, status: "SCOPED", assessorUserId: authorized.principal.userId, version: parsed.data.version } });
      await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "ASSESSMENT_CREATED", resourceType: "workspace_assessment", resourceId: created.id, requestId, metadata: { projectId, assessmentId: sourceAssessment.id, type: parsed.data.type, methodologyVersion: parsed.data.version } } });
      return created;
    });
    return NextResponse.json({ status: "created", assessmentId: assessment.id, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) { console.error("workspace_assessment_create_failed", { requestId, projectId, error }); return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
