import { NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { cancelAutomation, signalAutomation } from "@/lib/automation/engine";
import { pauseAutomation, retryAutomation } from "@/lib/automation/controls";
import { requireAutomationOperator } from "@/lib/automation/operator-auth";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const principal = await requireWorkspacePermission("workspace:manage");
  const operator = principal ? null : await requireAutomationOperator();
  if (!principal && !operator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId } = await params;
  const body = await request.json().catch(() => null);
  const organizationId = principal?.organizationId ?? (typeof body?.organizationId === "string" ? body.organizationId : "");
  if (!organizationId) return NextResponse.json({ error: "organizationId is required for operator controls" }, { status: 400 });
  const actorUserId = principal?.userId ?? operator!.userId;

  try {
    if (body?.action === "cancel") return NextResponse.json({ run: await cancelAutomation(runId, organizationId, actorUserId) });
    if (body?.action === "pause") return NextResponse.json({ run: await pauseAutomation(runId, organizationId, actorUserId) });
    if (body?.action === "retry") return NextResponse.json({ run: await retryAutomation(runId, organizationId, actorUserId) });
    if (body?.action === "resume") return NextResponse.json({ run: await signalAutomation(runId, organizationId, actorUserId, {}) });
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow control failed" }, { status: 400 });
  }
}
