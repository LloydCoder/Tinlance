import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ runId: string }> }) {
  const auth = await authenticateApi(request, "workflows:read"); if ("response" in auth) return auth.response; const { runId } = await context.params;
  const runs = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT r.id,r.organization_id AS "organizationId",r.project_id AS "projectId",r.assessment_id AS "assessmentId",r.status,r.trigger_type AS "triggerType",r.request_id AS "requestId",r.current_step AS "currentStep",r.started_at AS "startedAt",r.completed_at AS "completedAt",r.error_code AS "errorCode",r.error_message AS "errorMessage",p.slug AS "playbook",v.version AS "playbookVersion" FROM "automation_workflow_runs" r JOIN "automation_playbooks" p ON p.id=r.playbook_id JOIN "automation_playbook_versions" v ON v.id=r.playbook_version_id WHERE r.id=${runId} AND r.organization_id=${auth.principal.organizationId} LIMIT 1`);
  const run = runs[0]; if (!run) return problem(auth.principal.requestId, 404, "resource_not_found", "Workflow run not found");
  const steps = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"step_key" AS "stepKey",ordinal,"step_type" AS "stepType",status,"capability_id" AS "capabilityId","capability_version" AS "capabilityVersion","required_approval" AS "requiredApproval","authorization_decision" AS "authorizationDecision","started_at" AS "startedAt","completed_at" AS "completedAt","error_code" AS "errorCode" FROM "automation_workflow_steps" WHERE "workflow_run_id"=${runId} ORDER BY ordinal`);
  return ok(request, { run, steps });
}
