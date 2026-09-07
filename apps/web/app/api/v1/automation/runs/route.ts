import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";

export async function GET(request: Request) {
  const principal = await requireWorkspacePermission("project:read");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25) || 25, 1), 100);
  const rows = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT r.id,r."project_id",r."assessment_id",r.status,r."trigger_type",r."playbook_id",r."playbook_version_id",r."current_step",r."request_id",r."started_at",r."completed_at",r."created_at",r."updated_at",p.name AS "playbook_name"
    FROM "automation_workflow_runs" r JOIN "automation_playbooks" p ON p.id=r."playbook_id"
    WHERE r.organization_id=${principal.organizationId} ${projectId ? Prisma.sql`AND r.project_id=${projectId}` : Prisma.empty}
    ORDER BY r.created_at DESC LIMIT ${limit}
  `);
  return NextResponse.json({ runs: rows });
}
