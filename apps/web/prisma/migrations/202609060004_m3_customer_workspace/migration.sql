CREATE TYPE "ProjectWorkspaceStatus" AS ENUM ('DRAFT','ACTIVE','ASSESSMENT','FINDINGS_REVIEW','REPORTING','REMEDIATION','VERIFICATION','COMPLETED','ARCHIVED');
CREATE TYPE "WorkspaceAssessmentStatus" AS ENUM ('PLANNED','SCOPED','ACTIVE','EVIDENCE_COLLECTION','ANALYSIS','FINDINGS_REVIEW','COMPLETED','REPORT_ISSUED');
CREATE TYPE "WorkspaceResultStatus" AS ENUM ('PASS','FAIL','PARTIAL','NOT_ASSESSED','NOT_APPLICABLE','INCONCLUSIVE');
CREATE TYPE "WorkspaceFindingSeverity" AS ENUM ('CRITICAL','HIGH','MEDIUM','LOW','INFO');
CREATE TYPE "WorkspaceFindingStatus" AS ENUM ('DRAFT_INTERNAL','REVIEW','CUSTOMER_VISIBLE','OPEN','ACKNOWLEDGED','IN_PROGRESS','REMEDIATED','VERIFICATION_PENDING','VERIFIED','CLOSED','ACCEPTED_RISK','FALSE_POSITIVE','NOT_APPLICABLE','DUPLICATE');
CREATE TYPE "WorkspaceVisibility" AS ENUM ('CUSTOMER','CUSTOMER_CONFIDENTIAL','TINLANCE_INTERNAL','RESTRICTED');
CREATE TYPE "EvidenceIntegrityStatus" AS ENUM ('PENDING','VERIFIED','FAILED','SUPERSEDED');
CREATE TYPE "EvidenceRequestStatus" AS ENUM ('REQUESTED','SUBMITTED','REVIEWING','ACCEPTED','REJECTED','REOPENED');
CREATE TYPE "WorkspaceReportStatus" AS ENUM ('DRAFT','INTERNAL_REVIEW','APPROVED','PUBLISHED','SUPERSEDED');
CREATE TYPE "WorkspaceRemediationStatus" AS ENUM ('OPEN','PLANNED','IN_PROGRESS','BLOCKED','READY_FOR_VERIFICATION','CUSTOMER_ATTESTED','VERIFIED','CLOSED');
CREATE TYPE "VerificationResult" AS ENUM ('PASS','FAIL','INCONCLUSIVE');
CREATE TYPE "WorkspaceNoteKind" AS ENUM ('INTERNAL_NOTE','CUSTOMER_COMMENT');
CREATE TYPE "AIAuthorship" AS ENUM ('HUMAN_AUTHORED','AI_ASSISTED','AI_GENERATED','HUMAN_VERIFIED');

CREATE TABLE "ProjectWorkspaceState" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "status" "ProjectWorkspaceStatus" NOT NULL DEFAULT 'DRAFT',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "ownerUserId" TEXT,
  "startDate" TIMESTAMP(3),
  "targetDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectWorkspaceState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceAssessment" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "scope" JSONB NOT NULL,
  "methodology" TEXT NOT NULL,
  "status" "WorkspaceAssessmentStatus" NOT NULL DEFAULT 'PLANNED',
  "resultStatus" "WorkspaceResultStatus" NOT NULL DEFAULT 'NOT_ASSESSED',
  "assessorUserId" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceFinding" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "severity" "WorkspaceFindingSeverity" NOT NULL,
  "likelihood" TEXT,
  "impact" TEXT,
  "riskScore" DECIMAL(8,3),
  "riskMethodology" TEXT,
  "status" "WorkspaceFindingStatus" NOT NULL DEFAULT 'DRAFT_INTERNAL',
  "affectedAsset" TEXT,
  "recommendation" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "dueDate" TIMESTAMP(3),
  "visibility" "WorkspaceVisibility" NOT NULL DEFAULT 'TINLANCE_INTERNAL',
  "authorship" "AIAuthorship" NOT NULL DEFAULT 'HUMAN_AUTHORED',
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceEvidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "collectedAt" TIMESTAMP(3) NOT NULL,
  "collectedByUserId" TEXT,
  "contentHash" TEXT NOT NULL,
  "hashAlgorithm" TEXT NOT NULL DEFAULT 'SHA-256',
  "mimeType" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "storageReference" TEXT NOT NULL,
  "classification" "WorkspaceVisibility" NOT NULL DEFAULT 'CUSTOMER_CONFIDENTIAL',
  "integrityStatus" "EvidenceIntegrityStatus" NOT NULL DEFAULT 'PENDING',
  "visibility" "WorkspaceVisibility" NOT NULL DEFAULT 'CUSTOMER_CONFIDENTIAL',
  "versionNumber" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceFindingEvidence" (
  "findingId" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceFindingEvidence_pkey" PRIMARY KEY ("findingId","evidenceId")
);

CREATE TABLE "WorkspaceReport" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "currentVersion" INTEGER NOT NULL DEFAULT 1,
  "status" "WorkspaceReportStatus" NOT NULL DEFAULT 'DRAFT',
  "summary" TEXT,
  "generatedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "publishedByUserId" TEXT,
  "contentHash" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceReportVersion" (
  "id" TEXT NOT NULL,
  "reportId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceReportVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceRemediation" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ownerUserId" TEXT,
  "priority" TEXT NOT NULL,
  "status" "WorkspaceRemediationStatus" NOT NULL DEFAULT 'OPEN',
  "targetDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "verificationStatus" "VerificationResult" NOT NULL DEFAULT 'INCONCLUSIVE',
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceRemediation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceRemediationEvidence" (
  "remediationId" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceRemediationEvidence_pkey" PRIMARY KEY ("remediationId","evidenceId")
);

CREATE TABLE "WorkspaceVerification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "findingId" TEXT NOT NULL,
  "remediationId" TEXT,
  "verifierUserId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "result" "VerificationResult" NOT NULL,
  "notes" TEXT,
  "evidenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceVerification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceEvidenceRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "assessmentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requestedType" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "requestedByUserId" TEXT NOT NULL,
  "status" "EvidenceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
  "submittedEvidenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceEvidenceRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceNote" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "authorUserId" TEXT NOT NULL,
  "kind" "WorkspaceNoteKind" NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectWorkspaceState_projectId_key" ON "ProjectWorkspaceState"("projectId");
CREATE INDEX "ProjectWorkspaceState_organizationId_status_idx" ON "ProjectWorkspaceState"("organizationId","status");
CREATE INDEX "ProjectWorkspaceState_organizationId_updatedAt_idx" ON "ProjectWorkspaceState"("organizationId","updatedAt");
CREATE UNIQUE INDEX "WorkspaceAssessment_assessmentId_key" ON "WorkspaceAssessment"("assessmentId");
CREATE INDEX "WorkspaceAssessment_organizationId_projectId_status_idx" ON "WorkspaceAssessment"("organizationId","projectId","status");
CREATE INDEX "WorkspaceAssessment_projectId_createdAt_idx" ON "WorkspaceAssessment"("projectId","createdAt");
CREATE INDEX "WorkspaceAssessment_assessmentId_idx" ON "WorkspaceAssessment"("assessmentId");
CREATE UNIQUE INDEX "WorkspaceFinding_idempotencyKey_key" ON "WorkspaceFinding"("idempotencyKey");
CREATE INDEX "WorkspaceFinding_organizationId_projectId_status_idx" ON "WorkspaceFinding"("organizationId","projectId","status");
CREATE INDEX "WorkspaceFinding_projectId_severity_status_idx" ON "WorkspaceFinding"("projectId","severity","status");
CREATE INDEX "WorkspaceFinding_assessmentId_createdAt_idx" ON "WorkspaceFinding"("assessmentId","createdAt");
CREATE UNIQUE INDEX "WorkspaceEvidence_idempotencyKey_key" ON "WorkspaceEvidence"("idempotencyKey");
CREATE INDEX "WorkspaceEvidence_organizationId_projectId_createdAt_idx" ON "WorkspaceEvidence"("organizationId","projectId","createdAt");
CREATE INDEX "WorkspaceEvidence_projectId_classification_visibility_idx" ON "WorkspaceEvidence"("projectId","classification","visibility");
CREATE INDEX "WorkspaceEvidence_assessmentId_createdAt_idx" ON "WorkspaceEvidence"("assessmentId","createdAt");
CREATE INDEX "WorkspaceEvidence_contentHash_idx" ON "WorkspaceEvidence"("contentHash");
CREATE INDEX "WorkspaceFindingEvidence_evidenceId_idx" ON "WorkspaceFindingEvidence"("evidenceId");
CREATE UNIQUE INDEX "WorkspaceReport_idempotencyKey_key" ON "WorkspaceReport"("idempotencyKey");
CREATE INDEX "WorkspaceReport_organizationId_projectId_status_idx" ON "WorkspaceReport"("organizationId","projectId","status");
CREATE INDEX "WorkspaceReport_projectId_createdAt_idx" ON "WorkspaceReport"("projectId","createdAt");
CREATE UNIQUE INDEX "WorkspaceReportVersion_reportId_version_key" ON "WorkspaceReportVersion"("reportId","version");
CREATE INDEX "WorkspaceReportVersion_reportId_createdAt_idx" ON "WorkspaceReportVersion"("reportId","createdAt");
CREATE UNIQUE INDEX "WorkspaceRemediation_idempotencyKey_key" ON "WorkspaceRemediation"("idempotencyKey");
CREATE INDEX "WorkspaceRemediation_organizationId_projectId_status_idx" ON "WorkspaceRemediation"("organizationId","projectId","status");
CREATE INDEX "WorkspaceRemediation_findingId_status_idx" ON "WorkspaceRemediation"("findingId","status");
CREATE INDEX "WorkspaceRemediation_ownerUserId_status_targetDate_idx" ON "WorkspaceRemediation"("ownerUserId","status","targetDate");
CREATE INDEX "WorkspaceRemediationEvidence_evidenceId_idx" ON "WorkspaceRemediationEvidence"("evidenceId");
CREATE INDEX "WorkspaceVerification_organizationId_projectId_createdAt_idx" ON "WorkspaceVerification"("organizationId","projectId","createdAt");
CREATE INDEX "WorkspaceVerification_findingId_createdAt_idx" ON "WorkspaceVerification"("findingId","createdAt");
CREATE INDEX "WorkspaceVerification_remediationId_createdAt_idx" ON "WorkspaceVerification"("remediationId","createdAt");
CREATE INDEX "WorkspaceEvidenceRequest_organizationId_projectId_status_idx" ON "WorkspaceEvidenceRequest"("organizationId","projectId","status");
CREATE INDEX "WorkspaceEvidenceRequest_projectId_dueDate_idx" ON "WorkspaceEvidenceRequest"("projectId","dueDate");
CREATE INDEX "WorkspaceNote_organizationId_projectId_kind_createdAt_idx" ON "WorkspaceNote"("organizationId","projectId","kind","createdAt");
CREATE INDEX "WorkspaceNote_resourceType_resourceId_createdAt_idx" ON "WorkspaceNote"("resourceType","resourceId","createdAt");

ALTER TABLE "ProjectWorkspaceState" ADD CONSTRAINT "ProjectWorkspaceState_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectWorkspaceState" ADD CONSTRAINT "ProjectWorkspaceState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectWorkspaceState" ADD CONSTRAINT "ProjectWorkspaceState_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessment" ADD CONSTRAINT "WorkspaceAssessment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessment" ADD CONSTRAINT "WorkspaceAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessment" ADD CONSTRAINT "WorkspaceAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessment" ADD CONSTRAINT "WorkspaceAssessment_assessorUserId_fkey" FOREIGN KEY ("assessorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFinding" ADD CONSTRAINT "WorkspaceFinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFinding" ADD CONSTRAINT "WorkspaceFinding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFinding" ADD CONSTRAINT "WorkspaceFinding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFinding" ADD CONSTRAINT "WorkspaceFinding_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidence" ADD CONSTRAINT "WorkspaceEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidence" ADD CONSTRAINT "WorkspaceEvidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidence" ADD CONSTRAINT "WorkspaceEvidence_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidence" ADD CONSTRAINT "WorkspaceEvidence_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFindingEvidence" ADD CONSTRAINT "WorkspaceFindingEvidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "WorkspaceFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceFindingEvidence" ADD CONSTRAINT "WorkspaceFindingEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "WorkspaceEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReport" ADD CONSTRAINT "WorkspaceReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReport" ADD CONSTRAINT "WorkspaceReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReport" ADD CONSTRAINT "WorkspaceReport_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReport" ADD CONSTRAINT "WorkspaceReport_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReportVersion" ADD CONSTRAINT "WorkspaceReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "WorkspaceReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReportVersion" ADD CONSTRAINT "WorkspaceReportVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediation" ADD CONSTRAINT "WorkspaceRemediation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediation" ADD CONSTRAINT "WorkspaceRemediation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediation" ADD CONSTRAINT "WorkspaceRemediation_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "WorkspaceFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediation" ADD CONSTRAINT "WorkspaceRemediation_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediationEvidence" ADD CONSTRAINT "WorkspaceRemediationEvidence_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "WorkspaceRemediation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceRemediationEvidence" ADD CONSTRAINT "WorkspaceRemediationEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "WorkspaceEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "WorkspaceFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_remediationId_fkey" FOREIGN KEY ("remediationId") REFERENCES "WorkspaceRemediation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_verifierUserId_fkey" FOREIGN KEY ("verifierUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceVerification" ADD CONSTRAINT "WorkspaceVerification_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "WorkspaceEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidenceRequest" ADD CONSTRAINT "WorkspaceEvidenceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidenceRequest" ADD CONSTRAINT "WorkspaceEvidenceRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidenceRequest" ADD CONSTRAINT "WorkspaceEvidenceRequest_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidenceRequest" ADD CONSTRAINT "WorkspaceEvidenceRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceEvidenceRequest" ADD CONSTRAINT "WorkspaceEvidenceRequest_submittedEvidenceId_fkey" FOREIGN KEY ("submittedEvidenceId") REFERENCES "WorkspaceEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceNote" ADD CONSTRAINT "WorkspaceNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceNote" ADD CONSTRAINT "WorkspaceNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceNote" ADD CONSTRAINT "WorkspaceNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
