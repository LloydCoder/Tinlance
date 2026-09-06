import { describe, expect, it } from "vitest";
import { ProjectWorkspaceStatus, WorkspaceFindingStatus, WorkspaceRemediationStatus, WorkspaceReportStatus } from "@prisma/client";
import { assertFindingTransition, assertProjectTransition, assertRemediationTransition, assertReportTransition } from "./workflow";

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
    expect(() => assertFindingTransition(WorkspaceFindingStatus.VERIFICATION_PENDING, WorkspaceFindingStatus.VERIFIED)).not.toThrow();
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
});
