import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { signalAutomation } from "@/lib/automation/engine";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const principal = await requireWorkspacePermission("evidence:upload");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.evidenceId !== "string" || !body.evidenceId.trim()) {
    return NextResponse.json({ error: "evidenceId is required" }, { status: 400 });
  }
  if ("verificationEvidenceId" in body || "verificationResult" in body || "verifierUserId" in body) {
    return NextResponse.json({
      error: "Independent verification must be recorded through the privileged M3 verification workflow",
    }, { status: 400 });
  }

  const runRows = await db.$queryRaw<Array<{ project_id: string; assessment_id: string | null; status: string }>>(Prisma.sql`
    SELECT "project_id","assessment_id",status
    FROM "automation_workflow_runs"
    WHERE id=${runId} AND organization_id=${principal.organizationId}
    LIMIT 1
  `);
  if (!runRows[0]) return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });

  const evidence = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "WorkspaceEvidence"
    WHERE id=${body.evidenceId.trim()}
      AND "organizationId"=${principal.organizationId}
      AND "projectId"=${runRows[0].project_id}
      AND ("assessmentId" IS NULL OR "assessmentId"=${runRows[0].assessment_id})
      AND "integrityStatus"='VERIFIED'
      AND visibility IN ('CUSTOMER','CUSTOMER_CONFIDENTIAL')
      AND classification IN ('CUSTOMER','CUSTOMER_CONFIDENTIAL')
    LIMIT 1
  `);
  if (!evidence[0]) return NextResponse.json({ error: "Evidence is outside the workflow tenant/project" }, { status: 403 });

  try {
    const run = await signalAutomation(runId, principal.organizationId, principal.userId, {
      customerEvidenceId: evidence[0].id,
    });
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow input failed" }, { status: 400 });
  }
}
