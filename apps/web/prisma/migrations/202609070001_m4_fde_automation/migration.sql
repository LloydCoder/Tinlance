CREATE TABLE "automation_playbooks" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "created_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_playbooks_status_chk" CHECK ("status" IN ('DRAFT','VALIDATING','ACTIVE','DEPRECATED','RETIRED')),
  CONSTRAINT "automation_playbooks_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_playbooks_org_slug_key" ON "automation_playbooks"("organization_id", "slug");
CREATE INDEX "automation_playbooks_status_idx" ON "automation_playbooks"("status");

CREATE TABLE "automation_playbook_versions" (
  "id" TEXT PRIMARY KEY,
  "playbook_id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "definition" JSONB NOT NULL,
  "fde_capabilities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "evidence_requirements" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "human_checkpoints" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "completion_criteria" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "checksum" TEXT NOT NULL,
  "active_at" TIMESTAMP(3),
  "deprecated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_playbook_versions_playbook_fk" FOREIGN KEY ("playbook_id") REFERENCES "automation_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_playbook_versions_playbook_version_key" ON "automation_playbook_versions"("playbook_id", "version");
CREATE INDEX "automation_playbook_versions_active_idx" ON "automation_playbook_versions"("playbook_id", "active_at");

CREATE TABLE "automation_workflow_runs" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "assessment_id" TEXT,
  "playbook_id" TEXT NOT NULL,
  "playbook_version_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "trigger_type" TEXT NOT NULL,
  "initiating_actor_user_id" TEXT,
  "request_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "current_step" INTEGER NOT NULL DEFAULT 0,
  "state" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "result" JSONB,
  "error_code" TEXT,
  "error_message" TEXT,
  "lease_owner" TEXT,
  "lease_expires_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_workflow_runs_status_chk" CHECK ("status" IN ('PENDING','RUNNING','WAITING','PAUSED','WAITING_FOR_APPROVAL','RETRYING','COMPLETED','FAILED','CANCELLED','EXPIRED')),
  CONSTRAINT "automation_workflow_runs_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_runs_project_fk" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_runs_assessment_fk" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_runs_playbook_fk" FOREIGN KEY ("playbook_id") REFERENCES "automation_playbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_runs_version_fk" FOREIGN KEY ("playbook_version_id") REFERENCES "automation_playbook_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_workflow_runs_org_idempotency_key" ON "automation_workflow_runs"("organization_id", "idempotency_key");
CREATE INDEX "automation_workflow_runs_org_status_idx" ON "automation_workflow_runs"("organization_id", "status", "updated_at");
CREATE INDEX "automation_workflow_runs_project_idx" ON "automation_workflow_runs"("project_id", "created_at");
CREATE INDEX "automation_workflow_runs_lease_idx" ON "automation_workflow_runs"("status", "lease_expires_at");
CREATE INDEX "automation_workflow_runs_request_idx" ON "automation_workflow_runs"("request_id");

CREATE TABLE "automation_workflow_steps" (
  "id" TEXT PRIMARY KEY,
  "workflow_run_id" TEXT NOT NULL,
  "step_key" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "step_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "input" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "output" JSONB,
  "actor_type" TEXT,
  "actor_id" TEXT,
  "capability_id" TEXT,
  "capability_version" TEXT,
  "required_approval" BOOLEAN NOT NULL DEFAULT FALSE,
  "authorization_decision" TEXT,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "error_code" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_workflow_steps_status_chk" CHECK ("status" IN ('PENDING','RUNNING','WAITING','PAUSED','WAITING_FOR_APPROVAL','RETRYING','COMPLETED','FAILED','CANCELLED')),
  CONSTRAINT "automation_workflow_steps_run_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "automation_workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_steps_ordinal_chk" CHECK ("ordinal" >= 0)
);
CREATE UNIQUE INDEX "automation_workflow_steps_run_key" ON "automation_workflow_steps"("workflow_run_id", "step_key");
CREATE INDEX "automation_workflow_steps_run_status_idx" ON "automation_workflow_steps"("workflow_run_id", "status", "ordinal");

CREATE TABLE "automation_step_attempts" (
  "id" TEXT PRIMARY KEY,
  "step_id" TEXT NOT NULL,
  "attempt_no" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "request_id" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "duration_ms" INTEGER,
  "error_code" TEXT,
  "error_message" TEXT,
  "retry_at" TIMESTAMP(3),
  CONSTRAINT "automation_step_attempts_step_fk" FOREIGN KEY ("step_id") REFERENCES "automation_workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_step_attempts_step_attempt_key" ON "automation_step_attempts"("step_id", "attempt_no");
CREATE INDEX "automation_step_attempts_retry_idx" ON "automation_step_attempts"("retry_at", "status");

CREATE TABLE "automation_approvals" (
  "id" TEXT PRIMARY KEY,
  "workflow_run_id" TEXT NOT NULL,
  "step_id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "requested_by_user_id" TEXT,
  "approved_by_user_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "policy" TEXT NOT NULL,
  "decision" TEXT,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decided_at" TIMESTAMP(3),
  CONSTRAINT "automation_approvals_status_chk" CHECK ("status" IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  CONSTRAINT "automation_approvals_run_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "automation_workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_approvals_step_fk" FOREIGN KEY ("step_id") REFERENCES "automation_workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_approvals_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_approvals_requester_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "automation_approvals_approver_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_approvals_step_key" ON "automation_approvals"("step_id");
CREATE INDEX "automation_approvals_org_status_idx" ON "automation_approvals"("organization_id", "status", "requested_at");

CREATE TABLE "automation_artifacts" (
  "id" TEXT PRIMARY KEY,
  "workflow_run_id" TEXT NOT NULL,
  "step_id" TEXT,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "resource_type" TEXT,
  "resource_id" TEXT,
  "provenance" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "content_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_artifacts_run_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "automation_workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_artifacts_step_fk" FOREIGN KEY ("step_id") REFERENCES "automation_workflow_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "automation_artifacts_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_artifacts_project_fk" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "automation_artifacts_run_idx" ON "automation_artifacts"("workflow_run_id", "created_at");
CREATE INDEX "automation_artifacts_resource_idx" ON "automation_artifacts"("resource_type", "resource_id");
CREATE INDEX "automation_artifacts_org_project_idx" ON "automation_artifacts"("organization_id", "project_id", "created_at");

CREATE TABLE "automation_workflow_events" (
  "id" BIGSERIAL PRIMARY KEY,
  "workflow_run_id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "step_key" TEXT,
  "actor_type" TEXT,
  "actor_id" TEXT,
  "request_id" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_workflow_events_run_fk" FOREIGN KEY ("workflow_run_id") REFERENCES "automation_workflow_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_workflow_events_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "automation_workflow_events_run_idx" ON "automation_workflow_events"("workflow_run_id", "id");
CREATE INDEX "automation_workflow_events_org_idx" ON "automation_workflow_events"("organization_id", "created_at");

CREATE TABLE "automation_schedules" (
  "id" TEXT PRIMARY KEY,
  "organization_id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "playbook_id" TEXT NOT NULL,
  "playbook_version_id" TEXT NOT NULL,
  "interval_seconds" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "next_run_at" TIMESTAMP(3) NOT NULL,
  "last_run_at" TIMESTAMP(3),
  "idempotency_seed" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "automation_schedules_status_chk" CHECK ("status" IN ('ACTIVE','PAUSED','CANCELLED','EXPIRED')),
  CONSTRAINT "automation_schedules_interval_chk" CHECK ("interval_seconds" >= 3600),
  CONSTRAINT "automation_schedules_org_fk" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_schedules_project_fk" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "automation_schedules_playbook_fk" FOREIGN KEY ("playbook_id") REFERENCES "automation_playbooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "automation_schedules_version_fk" FOREIGN KEY ("playbook_version_id") REFERENCES "automation_playbook_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "automation_schedules_unique_active" ON "automation_schedules"("organization_id", "project_id", "playbook_id", "status");
CREATE INDEX "automation_schedules_due_idx" ON "automation_schedules"("status", "next_run_at");

INSERT INTO "automation_playbooks" ("id","organization_id","slug","name","description","status")
VALUES ('m4-fde-technical-assessment',NULL,'fde-technical-assessment','FDE Technical Assessment','Repeatable technical assessment using the canonical FDE Mastery triage capability with human review and M3 outcome integration.','ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO "automation_playbook_versions" ("id","playbook_id","version","objective","definition","fde_capabilities","evidence_requirements","human_checkpoints","completion_criteria","checksum","active_at")
VALUES (
 'm4-fde-technical-assessment-v1','m4-fde-technical-assessment','1.0.0','Execute a bounded FDE technical assessment and feed verified outcomes into the M3 customer workspace.',
 '{"maxDurationSeconds":3600,"maxSteps":12,"steps":[{"key":"validate_scope","type":"SYSTEM","retry":{"maxAttempts":1}},{"key":"execute_fde","type":"FDE","domain":"cybersecurity","capabilityId":"triage","capabilityVersion":"v1","retry":{"maxAttempts":3,"backoffSeconds":5},"timeoutSeconds":120},{"key":"persist_result","type":"SYSTEM","retry":{"maxAttempts":3,"backoffSeconds":2}},{"key":"generate_findings","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},{"key":"request_evidence","type":"CUSTOMER_INPUT","retry":{"maxAttempts":1}},{"key":"draft_report","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},{"key":"human_review","type":"APPROVAL","policy":"REPORT_PUBLICATION","retry":{"maxAttempts":1}},{"key":"publish_report","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},{"key":"create_remediation","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},{"key":"verification","type":"CUSTOMER_INPUT","retry":{"maxAttempts":1}},{"key":"close","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}},{"key":"schedule_reassessment","type":"SYSTEM","retry":{"maxAttempts":2,"backoffSeconds":2}}],"policies":{"dryRun":true,"externalWritesRequireApproval":true,"customerDataUntrusted":true}}'::jsonb,
 '[{"capabilityId":"triage","domain":"cybersecurity","version":"v1","risk":"READ_ANALYSIS"}]'::jsonb,
 '[{"type":"assessment_context","required":true},{"type":"customer_evidence","required":false}]'::jsonb,
 '[{"step":"human_review","policy":"REPORT_PUBLICATION","risk":"HIGH"}]'::jsonb,
 '{"status":"COMPLETED","reportPublished":true,"remediationCreated":true,"verificationRecorded":true}'::jsonb,
 'm4-v1-placeholder-checksum','2026-09-07T00:00:00.000Z'
)
ON CONFLICT DO NOTHING;
