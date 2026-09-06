import { NextResponse } from "next/server";
import { requirePrivileged } from "@/lib/auth/authorization";
import { opportunityTransitionSchema } from "@/lib/operations/contracts";
import { assertTransition } from "@/lib/commercial/workflow";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const actor = await requirePrivileged();
  if (!actor) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try {
    const parsed = opportunityTransitionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, select: { id: true, organizationId: true, stage: true } });
    if (!opportunity) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    assertTransition(opportunity.stage, parsed.data.to);
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.opportunity.updateMany({ where: { id: opportunity.id, stage: opportunity.stage }, data: { stage: parsed.data.to, lastActivityAt: new Date(), nextAction: parsed.data.nextAction ?? null, nextActionAt: parsed.data.nextActionAt ? new Date(parsed.data.nextActionAt) : null, lostReason: parsed.data.to === "DISQUALIFIED" || parsed.data.to === "DECLINED" ? parsed.data.reason ?? null : null } });
      if (result.count !== 1) throw new Error("opportunity_transition_race");
      await tx.auditEvent.create({ data: { organizationId: opportunity.organizationId, actorUserId: actor.userId, action: "opportunity.transitioned", resourceType: "opportunity", resourceId: opportunity.id, requestId, metadata: { from: opportunity.stage, to: parsed.data.to, reason: parsed.data.reason ?? null } } });
      return result;
    });
    return NextResponse.json({ status: "updated", requestId, opportunityId: opportunity.id, stage: parsed.data.to, updated: updated.count === 1 }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid opportunity transition")) return NextResponse.json({ error: "invalid_transition", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("opportunity_transition_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
