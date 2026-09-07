import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ findingId: z.string().min(1), title: z.string().trim().min(3).max(240), description: z.string().trim().min(10).max(20000), ownerUserId: z.string().trim().optional(), priority: z.string().trim().min(1).max(40), targetDate: z.string().datetime().optional() });

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "remediation:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const remediation = await db.workspaceRemediation.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, orderBy: { updatedAt: "desc" }, take: 100 });
  return NextResponse.json({ remediation, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "remediation:create");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const finding = await db.workspaceFinding.findFirst({ where: { id: parsed.data.findingId, projectId, organizationId: authorized.project.organizationId }, select: { id: true, status: true, title: true } });
  if (!finding) return NextResponse.json({ error: "finding_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (["CLOSED","FALSE_POSITIVE","NOT_APPLICABLE","DUPLICATE"].includes(finding.status)) return NextResponse.json({ error: "finding_not_remediable", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const existing = await db.workspaceRemediation.findFirst({ where: { findingId: finding.id, organizationId: authorized.project.organizationId, status: { not: "CLOSED" } }, select: { id: true } });
  if (existing) return NextResponse.json({ status: "already_exists", remediationId: existing.id, requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const remediation = await db.$transaction(async (tx) => {
    const created = await tx.workspaceRemediation.create({ data: { organizationId: authorized.project.organizationId, projectId, findingId: finding.id, title: parsed.data.title, description: parsed.data.description, ownerUserId: parsed.data.ownerUserId || null, priority: parsed.data.priority, targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null } });
    await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "REMEDIATION_CREATED", resourceType: "workspace_remediation", resourceId: created.id, requestId, metadata: { findingId: finding.id, priority: created.priority } } });
    return created;
  });
  return NextResponse.json({ status: "created", remediationId: remediation.id, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
