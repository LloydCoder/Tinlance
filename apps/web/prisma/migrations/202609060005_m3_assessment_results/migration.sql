CREATE TABLE "WorkspaceAssessmentResult" (
  "id" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "resultHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkspaceAssessmentResult_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkspaceAssessmentResult_assessmentId_key" ON "WorkspaceAssessmentResult"("assessmentId");
CREATE INDEX "WorkspaceAssessmentResult_organizationId_projectId_createdAt_idx" ON "WorkspaceAssessmentResult"("organizationId","projectId","createdAt");
ALTER TABLE "WorkspaceAssessmentResult" ADD CONSTRAINT "WorkspaceAssessmentResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "WorkspaceAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessmentResult" ADD CONSTRAINT "WorkspaceAssessmentResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssessmentResult" ADD CONSTRAINT "WorkspaceAssessmentResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
