ALTER TABLE "automation_workflow_runs" ADD COLUMN "next_run_at" TIMESTAMP(3);
CREATE INDEX "automation_workflow_runs_next_run_idx" ON "automation_workflow_runs"("status", "next_run_at");
