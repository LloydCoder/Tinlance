import { ProjectWorkspaceStatus, WorkspaceAssessmentStatus, WorkspaceFindingStatus, WorkspaceRemediationStatus, WorkspaceReportStatus } from "@prisma/client";

const projectTransitions: Record<ProjectWorkspaceStatus, readonly ProjectWorkspaceStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"], ACTIVE: ["ASSESSMENT", "ARCHIVED"], ASSESSMENT: ["FINDINGS_REVIEW", "ARCHIVED"], FINDINGS_REVIEW: ["REPORTING", "REMEDIATION", "ARCHIVED"], REPORTING: ["REMEDIATION", "VERIFICATION", "COMPLETED", "ARCHIVED"], REMEDIATION: ["VERIFICATION", "ARCHIVED"], VERIFICATION: ["REMEDIATION", "COMPLETED", "ARCHIVED"], COMPLETED: ["ARCHIVED"], ARCHIVED: [],
};
const assessmentTransitions: Record<WorkspaceAssessmentStatus, readonly WorkspaceAssessmentStatus[]> = {
  PLANNED: ["SCOPED", "ACTIVE"], SCOPED: ["ACTIVE", "EVIDENCE_COLLECTION"], ACTIVE: ["EVIDENCE_COLLECTION", "ANALYSIS"], EVIDENCE_COLLECTION: ["ANALYSIS"], ANALYSIS: ["FINDINGS_REVIEW", "COMPLETED"], FINDINGS_REVIEW: ["COMPLETED"], COMPLETED: ["REPORT_ISSUED"], REPORT_ISSUED: [],
};
const findingTransitions: Record<WorkspaceFindingStatus, readonly WorkspaceFindingStatus[]> = {
  DRAFT_INTERNAL: ["REVIEW"], REVIEW: ["CUSTOMER_VISIBLE", "DRAFT_INTERNAL"], CUSTOMER_VISIBLE: ["OPEN", "ACCEPTED_RISK", "FALSE_POSITIVE", "NOT_APPLICABLE", "DUPLICATE"], OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "ACCEPTED_RISK", "FALSE_POSITIVE", "DUPLICATE"], ACKNOWLEDGED: ["IN_PROGRESS", "ACCEPTED_RISK"], IN_PROGRESS: ["REMEDIATED", "VERIFICATION_PENDING", "ACCEPTED_RISK"], REMEDIATED: ["VERIFICATION_PENDING", "IN_PROGRESS"], VERIFICATION_PENDING: ["VERIFIED", "IN_PROGRESS"], VERIFIED: ["CLOSED", "IN_PROGRESS"], CLOSED: ["OPEN"], ACCEPTED_RISK: ["OPEN"], FALSE_POSITIVE: ["OPEN"], NOT_APPLICABLE: ["OPEN"], DUPLICATE: ["OPEN"],
};
const remediationTransitions: Record<WorkspaceRemediationStatus, readonly WorkspaceRemediationStatus[]> = {
  OPEN: ["PLANNED", "IN_PROGRESS", "BLOCKED"], PLANNED: ["IN_PROGRESS", "BLOCKED"], IN_PROGRESS: ["BLOCKED", "READY_FOR_VERIFICATION", "CUSTOMER_ATTESTED"], BLOCKED: ["IN_PROGRESS"], READY_FOR_VERIFICATION: ["VERIFIED", "IN_PROGRESS"], CUSTOMER_ATTESTED: ["READY_FOR_VERIFICATION", "IN_PROGRESS"], VERIFIED: ["CLOSED", "IN_PROGRESS"], CLOSED: ["OPEN"],
};
const reportTransitions: Record<WorkspaceReportStatus, readonly WorkspaceReportStatus[]> = {
  DRAFT: ["INTERNAL_REVIEW"], INTERNAL_REVIEW: ["APPROVED", "DRAFT"], APPROVED: ["PUBLISHED"], PUBLISHED: ["SUPERSEDED"], SUPERSEDED: [],
};

function assertAllowed<T extends string>(map: Record<T, readonly T[]>, from: T, to: T, label: string) {
  if (!map[from].includes(to)) throw new Error(`Invalid ${label} transition: ${from} -> ${to}`);
}

export const assertProjectTransition = (from: ProjectWorkspaceStatus, to: ProjectWorkspaceStatus) => assertAllowed(projectTransitions, from, to, "project");
export const assertAssessmentTransition = (from: WorkspaceAssessmentStatus, to: WorkspaceAssessmentStatus) => assertAllowed(assessmentTransitions, from, to, "assessment");
export const assertFindingTransition = (from: WorkspaceFindingStatus, to: WorkspaceFindingStatus) => assertAllowed(findingTransitions, from, to, "finding");
export const assertRemediationTransition = (from: WorkspaceRemediationStatus, to: WorkspaceRemediationStatus) => assertAllowed(remediationTransitions, from, to, "remediation");
export const assertReportTransition = (from: WorkspaceReportStatus, to: WorkspaceReportStatus) => assertAllowed(reportTransitions, from, to, "report");

export const projectTransitionTargets = (from: ProjectWorkspaceStatus) => [...projectTransitions[from]];
