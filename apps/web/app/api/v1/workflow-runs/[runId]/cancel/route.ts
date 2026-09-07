import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const auth = await authenticateApi(request, "workflows:execute"); if ("response" in auth) return auth.response; const { runId } = await context.params;
  const current = await db.$queryRaw<Array<{ id: string; status: string; project_id: string }>>(Prisma.sql`SELECT id,status,project_id FROM "automation_workflow_runs" WHERE id=${runId} AND organization_id=${auth.principal.organizationId} LIMIT 1`);
  if (!current[0]) return problem(auth.principal.requestId, 404, "resource_not_found", "Workflow run not found");
  if (["COMPLETED","FAILED","CANCELLED","EXPIRED"].includes(current[0].status)) return problem(auth.principal.requestId, 409, "conflict", "Workflow is already terminal");
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='CANCELLED',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=${runId} AND organization_id=${auth.principal.organizationId}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='CANCELLED',completed_at=CURRENT_TIMESTAMP WHERE workflow_run_id=${runId} AND status NOT IN ('COMPLETED','FAILED','CANCELLED')`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "AuditEvent" ("id","organizationId","actorUserId","action","resourceType","resourceId","requestId","metadata") VALUES (gen_random_uuid(),${auth.principal.organizationId},${auth.principal.userId},'WORKFLOW_CANCELLED','WorkflowRun',${runId},${auth.principal.requestId},'{}'::jsonb)`);
  });
  return ok(request, { id: runId, status: "CANCELLED" });
}
