import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { ensureProjectWorkspaceState } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request);
  const { projectId } = await context.params;
  const authorized = await authorizeProject(projectId, "project:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const state = await ensureProjectWorkspaceState(projectId, authorized.project.organizationId);
  if (!state) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const [assessments, findings, remediation, reports, evidenceRequests, recentActivity] = await Promise.all([
    db.workspaceAssessment.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.workspaceFinding.findMany({ where: { projectId, organizationId: authorized.project.organizationId, visibility: { in: ["CUSTOMER", "CUSTOMER_CONFIDENTIAL"] } }, orderBy: [{ severity: "asc" }, { createdAt: "desc" }], take: 50, select: { id: true, title: true, severity: true, status: true, dueDate: true, affectedAsset: true } }),
    db.workspaceRemediation.findMany({ where: { projectId, organizationId: authorized.project.organizationId }, orderBy: { updatedAt: "desc" }, take: 50, select: { id: true, findingId: true, title: true, priority: true, status: true, targetDate: true, verificationStatus: true } }),
    db.workspaceReport.findMany({ where: { projectId, organizationId: authorized.project.organizationId, status: { in: ["APPROVED", "PUBLISHED", "SUPERSEDED"] } }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, title: true, type: true, currentVersion: true, status: true, publishedAt: true } }),
    db.workspaceEvidenceRequest.findMany({ where: { projectId, organizationId: authorized.project.organizationId, status: { in: ["REQUESTED", "REOPENED", "REVIEWING"] } }, orderBy: { dueDate: "asc" }, take: 20 }),
    db.auditEvent.findMany({ where: { organizationId: authorized.project.organizationId, resourceType: { in: ["project", "workspace_finding", "workspace_evidence", "workspace_report", "workspace_remediation", "workspace_verification"] }, resourceId: { not: null } }, orderBy: { createdAt: "desc" }, take: 25, select: { id: true, action: true, resourceType: true, resourceId: true, actorUserId: true, createdAt: true, metadata: true } }),
  ]);
  return NextResponse.json({ project: authorized.project, workspace: state, assessments, findings, remediation, reports, evidenceRequests, recentActivity, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}
