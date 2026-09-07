import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

async function audit(tx: Prisma.TransactionClient, organizationId: string, actorUserId: string, action: string, runId: string) {
  await tx.$executeRaw(Prisma.sql`INSERT INTO "AuditEvent" ("id","organizationId","actorUserId","action","resourceType","resourceId","metadata") VALUES (${randomUUID()},${organizationId},${actorUserId},${action},'WorkflowRun',${runId},'{}'::jsonb)`);
}

export async function pauseAutomation(runId: string, organizationId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; status: string }>>(Prisma.sql`SELECT id,status FROM "automation_workflow_runs" WHERE id=${runId} AND "organization_id"=${organizationId} FOR UPDATE`);
    const run = rows[0];
    if (!run) throw new Error("workflow run not found");
    if (!["RUNNING", "RETRYING", "WAITING"].includes(run.status)) throw new Error("workflow cannot be paused in its current state");
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='PAUSED',"updated_at"=CURRENT_TIMESTAMP WHERE id=${runId}`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_workflow_events" ("workflow_run_id","organization_id","event_type","actor_type","actor_id","payload") VALUES (${runId},${organizationId},'WORKFLOW_PAUSED','user',${actorUserId},'{}'::jsonb)`);
    await audit(tx, organizationId, actorUserId, "WORKFLOW_PAUSED", runId);
    return (await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];
  });
}

export async function retryAutomation(runId: string, organizationId: string, actorUserId: string) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; status: string; current_step: number }>>(Prisma.sql`SELECT id,status,"current_step" FROM "automation_workflow_runs" WHERE id=${runId} AND "organization_id"=${organizationId} FOR UPDATE`);
    const run = rows[0];
    if (!run) throw new Error("workflow run not found");
    if (run.status !== "FAILED") throw new Error("only failed workflows can be retried");
    const steps = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "automation_workflow_steps" WHERE "workflow_run_id"=${runId} AND ordinal=${run.current_step} LIMIT 1`);
    if (!steps[0]) throw new Error("failed workflow step not found");
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_steps" SET status='PENDING',"error_code"=NULL,"error_message"=NULL,"updated_at"=CURRENT_TIMESTAMP WHERE id=${steps[0].id}`);
    await tx.$executeRaw(Prisma.sql`UPDATE "automation_workflow_runs" SET status='RUNNING',"error_code"=NULL,"error_message"=NULL,"completed_at"=NULL,"next_run_at"=CURRENT_TIMESTAMP,"updated_at"=CURRENT_TIMESTAMP WHERE id=${runId}`);
    await tx.$executeRaw(Prisma.sql`INSERT INTO "automation_workflow_events" ("workflow_run_id","organization_id","event_type","actor_type","actor_id","payload") VALUES (${runId},${organizationId},'WORKFLOW_RETRY_REQUESTED','user',${actorUserId},'{}'::jsonb)`);
    await audit(tx, organizationId, actorUserId, "WORKFLOW_RETRY_REQUESTED", runId);
    return (await tx.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT * FROM "automation_workflow_runs" WHERE id=${runId}`))[0];
  });
}
