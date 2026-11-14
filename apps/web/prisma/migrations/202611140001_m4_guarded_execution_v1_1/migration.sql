BEGIN;

ALTER TABLE "automation_schedules"
  ADD COLUMN IF NOT EXISTS "created_by_user_id" TEXT REFERENCES "User"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "lease_owner" TEXT,
  ADD COLUMN IF NOT EXISTS "lease_expires_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "automation_schedules_due_lease_idx"
  ON "automation_schedules" ("status","next_run_at","lease_expires_at");

UPDATE "automation_playbook_versions"
SET "deprecated_at" = CURRENT_TIMESTAMP
WHERE "playbook_id" = 'm4-fde-technical-assessment'
  AND "deprecated_at" IS NULL;

INSERT INTO "automation_playbook_versions" (
  "id",
  "playbook_id",
  "version",
  "objective",
  "definition",
  "fde_capabilities",
  "evidence_requirements",
  "human_checkpoints",
  "completion_criteria",
  "checksum",
  "active_at"
)
VALUES (
  'm4-fde-technical-assessment-v1-1',
  'm4-fde-technical-assessment',
  '1.1.0',
  'Execute a bounded FDE technical assessment with reviewed customer-visible findings, scoped evidence, human-approved report publication, and M3 independent remediation verification.',
  '{
    "maxDurationSeconds": 604800,
    "maxSteps": 12,
    "steps": [
      {"key":"validate_scope","type":"SYSTEM","retry":{"maxAttempts":1}},
      {"key":"execute_fde","type":"FDE","domain":"cybersecurity","capabilityId":"triage","capabilityVersion":"v1","retry":{"maxAttempts":3,"backoffSeconds":5},"timeoutSeconds":120},
      {"key":"persist_result","type":"SYSTEM","retry":{"maxAttempts":3,"backoffSeconds":2}},
      {"key":"generate_findings","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},
      {"key":"request_evidence","type":"CUSTOMER_INPUT","retry":{"maxAttempts":1}},
      {"key":"draft_report","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},
      {"key":"human_review","type":"APPROVAL","policy":"REPORT_PUBLICATION","retry":{"maxAttempts":1}},
      {"key":"publish_report","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},
      {"key":"create_remediation","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},
      {"key":"verification","type":"SYSTEM","retry":{"maxAttempts":1}},
      {"key":"close","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},
      {"key":"schedule_reassessment","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}}
    ],
    "policies": {
      "dryRun": false,
      "externalWritesRequireApproval": true,
      "customerDataUntrusted": true
    }
  }'::jsonb,
  '[{"capabilityId":"triage","domain":"cybersecurity","version":"v1","risk":"READ_ANALYSIS"}]'::jsonb,
  '[{"type":"assessment_context","required":true},{"type":"customer_evidence","required":false,"integrity":"VERIFIED","visibility":"CUSTOMER_CONFIDENTIAL"}]'::jsonb,
  '[{"step":"human_review","policy":"REPORT_PUBLICATION","risk":"HIGH"}]'::jsonb,
  '{"status":"COMPLETED","reportPublished":true,"remediationCreated":true,"verificationRecorded":true}'::jsonb,
  '1817878163e1da05465ed82ab87c93f05ac4f32809e4d3893908d2db1847ba81',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("playbook_id","version") DO NOTHING;

COMMIT;
