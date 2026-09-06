import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const requestId = getRequestId(request); const { requestId: evidenceRequestId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, "evidence:upload")) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const body = await request.json().catch(() => ({})) as { evidenceId?: string };
  if (!body.evidenceId) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const item = await db.workspaceEvidenceRequest.findUnique({ where: { id: evidenceRequestId }, select: { id: true, organizationId: true, projectId: true, status: true } });
  if (!item || (!principal.isPrivileged && item.organizationId !== principal.organizationId)) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const evidence = await db.workspaceEvidence.findFirst({ where: { id: body.evidenceId, organizationId: item.organizationId, projectId: item.projectId }, select: { id: true } });
  if (!evidence) return NextResponse.json({ error: "evidence_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  await db.$transaction(async (tx) => {
    await tx.workspaceEvidenceRequest.update({ where: { id: item.id }, data: { status: "SUBMITTED", submittedEvidenceId: evidence.id } });
    await tx.auditEvent.create({ data: { organizationId: item.organizationId, actorUserId: principal.userId, action: "EVIDENCE_REQUEST_SUBMITTED", resourceType: "workspace_evidence_request", resourceId: item.id, requestId, metadata: { evidenceId: evidence.id } } });
  });
  return NextResponse.json({ status: "submitted", requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
