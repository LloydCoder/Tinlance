import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const customerActions = new Set(["PROJECT_STATE_CHANGED","ASSESSMENT_CREATED","ASSESSMENT_COMPLETED","EVIDENCE_REQUESTED","EVIDENCE_REQUEST_SUBMITTED","EVIDENCE_UPLOADED","EVIDENCE_DOWNLOADED","FINDING_STATUS_CHANGED","REPORT_CREATED","REPORT_PUBLISHED","REPORT_VIEWED","REMEDIATION_CREATED","REMEDIATION_STATUS_CHANGED","REMEDIATION_VERIFIED"]);

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "project:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const [assessments, findings, evidence, reports, remediation] = await Promise.all([
    db.workspaceAssessment.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, select: { id: true } }),
    db.workspaceFinding.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, select: { id: true } }),
    db.workspaceEvidence.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, select: { id: true } }),
    db.workspaceReport.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, select: { id: true } }),
    db.workspaceRemediation.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, select: { id: true } }),
  ]);
  const resourceIds = [projectId, ...assessments.map((x) => x.id), ...findings.map((x) => x.id), ...evidence.map((x) => x.id), ...reports.map((x) => x.id), ...remediation.map((x) => x.id)];
  const events = await db.auditEvent.findMany({ where: { organizationId: authorized.project.organizationId, resourceId: { in: resourceIds }, action: { in: [...customerActions] } }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, action: true, resourceType: true, resourceId: true, actorUserId: true, createdAt: true, metadata: true } });
  return NextResponse.json({ events, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}
