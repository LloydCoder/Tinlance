import { NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { cancelAutomation, signalAutomation } from "@/lib/automation/engine";
import { pauseAutomation, retryAutomation } from "@/lib/automation/controls";

export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const principal = await requireWorkspacePermission("workspace:manage");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { runId } = await params;
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === "cancel") return NextResponse.json({ run: await cancelAutomation(runId, principal.organizationId, principal.userId) });
    if (body?.action === "pause") return NextResponse.json({ run: await pauseAutomation(runId, principal.organizationId, principal.userId) });
    if (body?.action === "retry") return NextResponse.json({ run: await retryAutomation(runId, principal.organizationId, principal.userId) });
    if (body?.action === "resume") return NextResponse.json({ run: await signalAutomation(runId, principal.organizationId, principal.userId, { resume: true }) });
    if (body?.action === "signal" && body.signal && typeof body.signal === "object") return NextResponse.json({ run: await signalAutomation(runId, principal.organizationId, principal.userId, body.signal) });
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Workflow control failed" }, { status: 400 });
  }
}
