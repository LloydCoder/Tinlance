import { Prisma } from "@prisma/client";
import { db } from "../../../lib/db";
import { auth } from "../../../lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AutomationOps } from "../../../components/admin/automation-ops";

export default async function AutomationAdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "super-admin"].includes(session.user.role ?? "")) redirect("/portal/projects");
  const runs = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT r.id,r."organization_id",r."project_id",r.status,r."trigger_type",r."current_step",r."error_code",r."error_message",r."updated_at",p.name AS "playbook_name"
    FROM "automation_workflow_runs" r JOIN "automation_playbooks" p ON p.id=r."playbook_id"
    ORDER BY r."updated_at" DESC LIMIT 100
  `);
  return <main className="admin-page"><div className="admin-page-head"><p className="kicker">AUTOMATION CONTROL PLANE</p><h1>Workflow operations</h1><p>Monitor durable FDE runs and apply audited pause, resume, retry and cancellation controls.</p></div><AutomationOps initialRuns={runs} /></main>;
}
