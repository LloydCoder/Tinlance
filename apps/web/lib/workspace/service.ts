import { ProjectWorkspaceStatus, WorkspaceFindingStatus, WorkspaceRemediationStatus, WorkspaceReportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertFindingTransition, assertProjectTransition, assertRemediationTransition, assertReportTransition } from "@/lib/workspace/workflow";

export async function ensureProjectWorkspaceState(projectId: string, organizationId: string) {
  const project = await db.project.findFirst({ where: { id: projectId, organizationId }, select: { id: true, status: true, dueAt: true, engagementId: true } });
  if (!project) return null;
  const initial = project.status === "active" ? ProjectWorkspaceStatus.ACTIVE : ProjectWorkspaceStatus.DRAFT;
  return db.projectWorkspaceState.upsert({ where: { projectId }, update: {}, create: { projectId, organizationId, status: initial, targetDate: project.dueAt } });
}

export async function transitionProject(input: { projectId: string; organizationId: string; actorUserId: string; to: ProjectWorkspaceStatus; requestId: string }) {
  const state = await db.projectWorkspaceState.findFirst({ where: { projectId: input.projectId, organizationId: input.organizationId } });
  if (!state) throw new Error("workspace_state_not_found");
  assertProjectTransition(state.status, input.to);
  return db.$transaction(async (tx) => {
    const result = await tx.projectWorkspaceState.updateMany({ where: { id: state.id, status: state.status }, data: { status: input.to, completedAt: input.to === "COMPLETED" ? new Date() : state.completedAt } });
    if (result.count !== 1) throw new Error("project_transition_race");
    await tx.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "PROJECT_STATE_CHANGED", resourceType: "project", resourceId: input.projectId, requestId: input.requestId, metadata: { from: state.status, to: input.to } } });
    return { status: input.to, updated: true };
  });
}

export async function transitionFinding(input: { findingId: string; organizationId: string; actorUserId: string; to: WorkspaceFindingStatus; requestId: string }) {
  const finding = await db.workspaceFinding.findFirst({ where: { id: input.findingId, organizationId }, select: { id: true, status: true, projectId: true } });
  if (!finding) throw new Error("finding_not_found");
  assertFindingTransition(finding.status, input.to);
  return db.$transaction(async (tx) => {
    const result = await tx.workspaceFinding.updateMany({ where: { id: finding.id, status: finding.status }, data: { status: input.to, visibility: ["CUSTOMER_VISIBLE","OPEN","ACKNOWLEDGED","IN_PROGRESS","REMEDIATED","VERIFICATION_PENDING","VERIFIED","CLOSED"].includes(input.to) ? "CUSTOMER" : undefined } });
    if (result.count !== 1) throw new Error("finding_transition_race");
    await tx.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "FINDING_STATUS_CHANGED", resourceType: "workspace_finding", resourceId: finding.id, requestId: input.requestId, metadata: { from: finding.status, to: input.to } });
    return { status: input.to };
  });
}

export async function transitionRemediation(input: { remediationId: string; organizationId: string; actorUserId: string; to: WorkspaceRemediationStatus; requestId: string }) {
  const remediation = await db.workspaceRemediation.findFirst({ where: { id: input.remediationId, organizationId }, select: { id: true, status: true, projectId: true, findingId: true } });
  if (!remediation) throw new Error("remediation_not_found");
  assertRemediationTransition(remediation.status, input.to);
  return db.$transaction(async (tx) => {
    const result = await tx.workspaceRemediation.updateMany({ where: { id: remediation.id, status: remediation.status }, data: { status: input.to, completedAt: ["VERIFIED","CLOSED"].includes(input.to) ? new Date() : undefined, verificationStatus: input.to === "VERIFIED" ? "PASS" : undefined } });
    if (result.count !== 1) throw new Error("remediation_transition_race");
    if (input.to === "READY_FOR_VERIFICATION") {
      const finding = await tx.workspaceFinding.findUnique({ where: { id: remediation.findingId }, select: { status: true } });
      if (finding && ["IN_PROGRESS","REMEDIATED"].includes(finding.status)) await tx.workspaceFinding.update({ where: { id: remediation.findingId }, data: { status: "VERIFICATION_PENDING", visibility: "CUSTOMER" } });
    }
    await tx.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: "REMEDIATION_STATUS_CHANGED", resourceType: "workspace_remediation", resourceId: remediation.id, requestId: input.requestId, metadata: { from: remediation.status, to: input.to } } });
    return { status: input.to };
  });
}

export async function transitionReport(input: { reportId: string; organizationId: string; actorUserId: string; to: WorkspaceReportStatus; requestId: string }) {
  const report = await db.workspaceReport.findFirst({ where: { id: input.reportId, organizationId }, select: { id: true, status: true, currentVersion: true } });
  if (!report) throw new Error("report_not_found");
  assertReportTransition(report.status, input.to);
  return db.$transaction(async (tx) => {
    const result = await tx.workspaceReport.updateMany({ where: { id: report.id, status: report.status }, data: { status: input.to, publishedAt: input.to === "PUBLISHED" ? new Date() : undefined, publishedByUserId: input.to === "PUBLISHED" ? input.actorUserId : undefined } });
    if (result.count !== 1) throw new Error("report_transition_race");
    await tx.auditEvent.create({ data: { organizationId: input.organizationId, actorUserId: input.actorUserId, action: input.to === "PUBLISHED" ? "REPORT_PUBLISHED" : "REPORT_STATUS_CHANGED", resourceType: "workspace_report", resourceId: input.report.id, requestId: input.requestId, metadata: { from: report.status, to: input.to, version: report.currentVersion } } });
    return { status: input.to, version: report.currentVersion };
  });
}
