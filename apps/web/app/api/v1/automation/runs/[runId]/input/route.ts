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
  const runRows = await db.$queryRaw<Array<{ project_id: string; status: string }>>(Prisma.sql`SELECT "project_id",status FROM "automation_workflow_runs" WHERE id=${runId} AND organization_id=${principal.organizationId} LIMIT 1`);
  if (!runRows[0]) return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
  const signal: Record<string, unknown> = {};
  if (typeof body?.evidenceId === "string") {
    const evidence = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "WorkspaceEvidence" WHERE id=${body.evidenceId} AND "organizationId"=${principal.organizationId} AND "projectId"=${runRows[0].project_id} LIMIT 1`);
    if (!evidence[0]) return NextResponse.json({ error: "Evidence is outside the workflow tenant/project" }, { status: 403 });
    signal.customerEvidenceId = evidence[0].id;
  }
  if (typeof body?.verificationEvidenceId === "string") {
    const evidence = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT id FROM "WorkspaceEvidence" WHERE id=${body.verificationEvidenceId} AND "organizationId"=${principal.organizationId} AND "projectId"=${runRows[0].project_id} LIMIT 1`);
    if (!evidence[0]) return NextResponse.json({ error: "Verification evidence is outside the workflow tenant/project" }, { status: 403 });
    signal.verificationEvidenceId = evidence[0].id;
  }
  if (body?.verificationResult === "PASS" || body?.verificationResult === "FAIL" || body?.verificationResult === "INCONCLUSIVE") signal.verificationResult = body.verificationResult;
  if (!Object.keys(signal).length) return NextResponse.json({ error: "No supported workflow input supplied" }, { status: 400 });
  try { return NextResponse.json({ run: await signalAutomation(runId, principal.organizationId, principal.userId, signal) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow input failed" }, { status: 400 }); }
}
