import { NextResponse } from "next/server";
import { approveAutomation } from "@/lib/automation/engine";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { requireAutomationOperator } from "@/lib/automation/operator-auth";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string; approvalId: string }> }) {
  const principal = await requireWorkspacePermission("report:publish");
  const operator = principal ? null : await requireAutomationOperator();
  if (!principal && !operator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId, approvalId } = await params;
  const body = await request.json().catch(() => null);
  if (body?.decision !== "APPROVED" && body?.decision !== "REJECTED") return NextResponse.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
  const organizationId = principal?.organizationId ?? (typeof body?.organizationId === "string" ? body.organizationId : "");
  if (!organizationId) return NextResponse.json({ error: "organizationId is required for operator approvals" }, { status: 400 });
  try {
    const run = await approveAutomation(runId, organizationId, approvalId, principal?.userId ?? operator!.userId, body.decision);
    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval failed" }, { status: 400 });
  }
}
