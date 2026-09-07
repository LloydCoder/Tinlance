import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const principal = await requireWorkspacePermission("project:read");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId } = await params;
  const runs = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT r.*,p.name AS "playbook_name",v.version AS "playbook_version" FROM "automation_workflow_runs" r JOIN "automation_playbooks" p ON p.id=r."playbook_id" JOIN "automation_playbook_versions" v ON v.id=r."playbook_version_id" WHERE r.id=${runId} AND r.organization_id=${principal.organizationId} LIMIT 1`);
  const run = runs[0];
  if (!run) return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
  const [steps, approvals, artifacts, events] = await Promise.all([
    db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"step_key",ordinal,"step_type",status,output,"capability_id","capability_version","required_approval","authorization_decision","started_at","completed_at","duration_ms","error_code","error_message" FROM "automation_workflow_steps" WHERE "workflow_run_id"=${runId} ORDER BY ordinal`),
    db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"step_id",status,policy,decision,"requested_at","decided_at" FROM "automation_approvals" WHERE "workflow_run_id"=${runId} ORDER BY "requested_at" DESC`),
    db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"step_id",type,"resource_type","resource_id",provenance,"content_hash","created_at" FROM "automation_artifacts" WHERE "workflow_run_id"=${runId} ORDER BY "created_at"`),
    db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"event_type","step_key","actor_type","request_id",payload,"created_at" FROM "automation_workflow_events" WHERE "workflow_run_id"=${runId} ORDER BY id`),
  ]);
  return NextResponse.json({ run, steps, approvals, artifacts, events });
}
