ALTER TABLE "EvaluationRun" ADD COLUMN IF NOT EXISTS "assessmentId" TEXT;
CREATE INDEX IF NOT EXISTS "EvaluationRun_assessment_idx" ON "EvaluationRun"("organizationId","assessmentId");