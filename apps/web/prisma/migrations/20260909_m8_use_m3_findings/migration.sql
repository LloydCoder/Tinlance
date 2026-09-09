DROP TABLE IF EXISTS "EvaluationFinding";
CREATE INDEX IF NOT EXISTS "EvaluationResult_security_idx" ON "EvaluationResult"("organizationId","severity","status");