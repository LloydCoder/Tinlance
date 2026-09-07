import { NextResponse } from "next/server";
import { approveAutomation } from "@/lib/automation/engine";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string; approvalId: string }> }) {
  const principal = await requireWorkspacePermission("report:publish");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId, approvalId } = await params;
  const body = await request.json().catch(() => null);
  if (body?.decision !== "APPROVED" && body?.decision !== "REJECTED") return NextResponse.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
  try {
    const run = await approveAutomation(runId, principal.organizationId, approvalId, principal.userId, body.decision);
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval failed" }, { status: 400 });
  }
}
