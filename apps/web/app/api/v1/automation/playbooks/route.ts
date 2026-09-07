import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";

export async function GET() {
  const principal = await requireWorkspacePermission("project:read");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.$queryRaw<Array<{ id: string; slug: string; name: string; description: string; status: string; version: string; objective: string; checksum: string }>>(Prisma.sql`
    SELECT p.id,p.slug,p.name,p.description,p.status,v.version,v.objective,v.checksum
    FROM "automation_playbooks" p JOIN "automation_playbook_versions" v ON v.playbook_id=p.id
    WHERE p.status='ACTIVE' AND (p."organization_id" IS NULL OR p."organization_id"=${principal.organizationId})
      AND v."active_at" IS NOT NULL AND v."deprecated_at" IS NULL
    ORDER BY p.name,v."active_at" DESC
  `);
  return NextResponse.json({ playbooks: rows });
}
