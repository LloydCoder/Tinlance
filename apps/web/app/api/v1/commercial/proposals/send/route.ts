import { NextResponse } from "next/server";
import { ProposalStatus, OpportunityStage } from "@prisma/client";
import { requirePrivileged } from "@/lib/auth/authorization";
import { proposalSendSchema } from "@/lib/operations/contracts";
import { sendCommercialEmail } from "@/lib/commercial/notifications";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const actor = await requirePrivileged();
  if (!actor) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try {
    const parsed = proposalSendSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const proposal = await db.proposal.findUnique({ where: { id: parsed.data.proposalId }, include: { lead: true, versions: { where: { version: { equals: 1 } }, take: 1 } } });
    if (!proposal) return NextResponse.json({ error: "proposal_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (![ProposalStatus.DRAFT, ProposalStatus.INTERNAL_REVIEW, ProposalStatus.VIEWED].includes(proposal.status)) return NextResponse.json({ error: "proposal_not_sendable", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.expiresAt && proposal.expiresAt <= new Date()) return NextResponse.json({ error: "proposal_expired", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    const version = proposal.versions[0];
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.proposal.updateMany({ where: { id: proposal.id, status: { in: [ProposalStatus.DRAFT, ProposalStatus.INTERNAL_REVIEW, ProposalStatus.VIEWED] } }, data: { status: ProposalStatus.SENT, sentAt: new Date() } });
      if (result.count !== 1) throw new Error("proposal_send_race");
      if (proposal.opportunityId) await tx.opportunity.update({ where: { id: proposal.opportunityId }, data: { stage: OpportunityStage.PROPOSAL_SENT, lastActivityAt: new Date(), nextAction: "Follow up on proposal", nextActionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } });
      await tx.auditEvent.create({ data: { organizationId: proposal.organizationId, actorUserId: actor.userId, action: "proposal.sent", resourceType: "proposal", resourceId: proposal.id, requestId, metadata: { version: proposal.currentVersion } } });
      return result;
    });

    const email = await sendCommercialEmail({
      action: "proposal.sent",
      resourceId: proposal.id,
      to: proposal.lead.email,
      subject: `Tinlance proposal ${proposal.proposalNumber}`,
      html: `<p>Your Tinlance proposal <strong>${proposal.proposalNumber}</strong> is ready.</p><p><a href="${new URL(`/proposal/${proposal.publicTokenHash}`, request.url).origin}/proposal/${proposal.publicTokenHash}">View proposal</a></p>`,
      requestId,
      organizationId: proposal.organizationId,
    }).catch((error) => { console.error("proposal_notification_failed", { requestId, error }); return { sent: false, duplicate: false, configured: false }; });

    void version;
    return NextResponse.json({ status: "sent", requestId, proposalId: proposal.id, notification: email, updated: updated.count === 1 }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    console.error("proposal_send_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
