import { describe, expect, it } from "vitest";
import { ProjectWorkspaceStatus, WorkspaceFindingStatus, WorkspaceRemediationStatus, WorkspaceReportStatus } from "@prisma/client";
import { assertFindingCanEnterVerification, assertFindingTransition, assertIndependentVerification, assertProjectTransition, assertRemediationTransition, assertReportTransition } from "./workflow";

describe("M3 workspace state machines", () => {
  it("allows the project delivery path", () => {
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.DRAFT, ProjectWorkspaceStatus.ACTIVE)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.ACTIVE, ProjectWorkspaceStatus.ASSESSMENT)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.ASSESSMENT, ProjectWorkspaceStatus.FINDINGS_REVIEW)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.FINDINGS_REVIEW, ProjectWorkspaceStatus.REPORTING)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.REPORTING, ProjectWorkspaceStatus.REMEDIATION)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.REMEDIATION, ProjectWorkspaceStatus.VERIFICATION)).not.toThrow();
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.VERIFICATION, ProjectWorkspaceStatus.COMPLETED)).not.toThrow();
  });

  it("blocks project lifecycle skipping", () => {
    expect(() => assertProjectTransition(ProjectWorkspaceStatus.DRAFT, ProjectWorkspaceStatus.COMPLETED)).toThrow(/Invalid project transition/);
  });

  it("requires explicit finding verification before closure", () => {
    expect(() => assertFindingTransition(WorkspaceFindingStatus.VERIFICATION_PENDING, WorkspaceFindingStatus.IN_PROGRESS)).not.toThrow();
    expect(() => assertFindingTransition(WorkspaceFindingStatus.IN_PROGRESS, WorkspaceFindingStatus.CLOSED)).toThrow(/Invalid finding transition/);
  });

  it("keeps customer attestation separate from verification", () => {
    expect(() => assertRemediationTransition(WorkspaceRemediationStatus.IN_PROGRESS, WorkspaceRemediationStatus.CUSTOMER_ATTESTED)).not.toThrow();
    expect(() => assertRemediationTransition(WorkspaceRemediationStatus.IN_PROGRESS, WorkspaceRemediationStatus.VERIFIED)).toThrow(/Invalid remediation transition/);
  });

  it("requires review before report publication", () => {
    expect(() => assertReportTransition(WorkspaceReportStatus.DRAFT, WorkspaceReportStatus.PUBLISHED)).toThrow(/Invalid report transition/);
    expect(() => assertReportTransition(WorkspaceReportStatus.APPROVED, WorkspaceReportStatus.PUBLISHED)).not.toThrow();
  });

  it("blocks direct remediation transitions from bypassing the verification record", () => {
    expect(() => assertRemediationTransition(WorkspaceRemediationStatus.READY_FOR_VERIFICATION, WorkspaceRemediationStatus.VERIFIED)).toThrow(/Invalid remediation transition/);
  });

  it("blocks direct finding transitions from bypassing the verification record", () => {
    expect(() => assertFindingTransition(WorkspaceFindingStatus.VERIFICATION_PENDING, WorkspaceFindingStatus.VERIFIED)).toThrow(/Invalid finding transition/);
  });

  it("requires a finding to be in a remediated workflow state before verification", () => {
    expect(() => assertFindingCanEnterVerification(WorkspaceFindingStatus.IN_PROGRESS)).not.toThrow();
    expect(() => assertFindingCanEnterVerification(WorkspaceFindingStatus.REMEDIATED)).not.toThrow();
    expect(() => assertFindingCanEnterVerification(WorkspaceFindingStatus.VERIFICATION_PENDING)).not.toThrow();
    expect(() => assertFindingCanEnterVerification(WorkspaceFindingStatus.ACCEPTED_RISK)).toThrow("finding_not_ready_for_verification");
    expect(() => assertFindingCanEnterVerification(WorkspaceFindingStatus.CLOSED)).toThrow("finding_not_ready_for_verification");
  });

  it("requires a ready remediation, pending finding and independent verifier", () => {
    expect(() => assertIndependentVerification({
      remediationStatus: WorkspaceRemediationStatus.READY_FOR_VERIFICATION,
      findingStatus: WorkspaceFindingStatus.VERIFICATION_PENDING,
      ownerUserId: "customer-1",
      verifierUserId: "verifier-1",
    })).not.toThrow();
    expect(() => assertIndependentVerification({
      remediationStatus: WorkspaceRemediationStatus.IN_PROGRESS,
      findingStatus: WorkspaceFindingStatus.VERIFICATION_PENDING,
      ownerUserId: "customer-1",
      verifierUserId: "verifier-1",
    })).toThrow("remediation_not_ready_for_verification");
    expect(() => assertIndependentVerification({
      remediationStatus: WorkspaceRemediationStatus.READY_FOR_VERIFICATION,
      findingStatus: WorkspaceFindingStatus.IN_PROGRESS,
      ownerUserId: "customer-1",
      verifierUserId: "verifier-1",
    })).toThrow("finding_not_ready_for_verification");
    expect(() => assertIndependentVerification({
      remediationStatus: WorkspaceRemediationStatus.READY_FOR_VERIFICATION,
      findingStatus: WorkspaceFindingStatus.VERIFICATION_PENDING,
      ownerUserId: "customer-1",
      verifierUserId: "customer-1",
    })).toThrow("verifier_must_be_independent");
  });
});
