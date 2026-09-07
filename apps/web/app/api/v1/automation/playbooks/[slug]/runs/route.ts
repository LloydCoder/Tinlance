import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { startAutomation } from "@/lib/automation/engine";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const principal = await requireWorkspacePermission("assessment:execute");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { slug } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.projectId !== "string" || !body.projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (!idempotencyKey) return NextResponse.json({ error: "Idempotency-Key is required" }, { status: 400 });
  try {
    const run = await startAutomation({ organizationId: principal.organizationId, projectId: body.projectId, assessmentId: typeof body.assessmentId === "string" ? body.assessmentId : undefined, playbookSlug: slug, actorUserId: principal.userId, triggerType: "MANUAL", idempotencyKey, requestId: request.headers.get("x-request-id") ?? randomUUID(), input: { scope: body.scope ?? {}, context: body.context ?? {}, parameters: body.parameters ?? {} } });
    return NextResponse.json({ run }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start workflow" }, { status: 400 });
  }
}
