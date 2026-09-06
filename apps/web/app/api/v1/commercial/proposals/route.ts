import { NextResponse } from "next/server";
import { requirePrivileged } from "@/lib/auth/authorization";
import { proposalCreateSchema } from "@/lib/operations/contracts";
import { createProposalToken } from "@/lib/commercial/security";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const actor = await requirePrivileged();
  if (!actor) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  try {
    const raw = await request.json();
    const parsed = proposalCreateSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    const lead = await db.lead.findUnique({ where: { id: parsed.data.leadId }, select: { id: true, organizationId: true } });
    if (!lead) return NextResponse.json({ error: "lead_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (parsed.data.assessmentId) {
      const assessment = await db.assessment.findUnique({ where: { id: parsed.data.assessmentId }, select: { leadId: true } });
      if (!assessment || assessment.leadId !== lead.id) return NextResponse.json({ error: "assessment_mismatch", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }
    if (parsed.data.opportunityId) {
      const opportunity = await db.opportunity.findUnique({ where: { id: parsed.data.opportunityId }, select: { leadId: true } });
      if (!opportunity || opportunity.leadId !== lead.id) return NextResponse.json({ error: "opportunity_mismatch", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }

    const { token, hash } = createProposalToken();
    const proposalNumber = `TL-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    const proposal = await db.$transaction(async (tx) => {
      const created = await tx.proposal.create({ data: {
        proposalNumber, organizationId: lead.organizationId, leadId: lead.id, assessmentId: parsed.data.assessmentId,
        opportunityId: parsed.data.opportunityId, title: parsed.data.title, publicTokenHash: hash, expiresAt, createdByUserId: actor.userId,
        versions: { create: { version: 1, ...parsed.data.version, pricing: parsed.data.version.pricing, createdByUserId: actor.userId } },
      }, select: { id: true, proposalNumber: true } });
      if (parsed.data.opportunityId) await tx.opportunity.update({ where: { id: parsed.data.opportunityId }, data: { stage: "PROPOSAL_DRAFT", lastActivityAt: new Date(), nextAction: "Review and send proposal", nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      await tx.auditEvent.create({ data: { organizationId: lead.organizationId, actorUserId: actor.userId, action: "proposal.created", resourceType: "proposal", resourceId: created.id, requestId, metadata: { proposalNumber: created.proposalNumber, version: 1 } } });
      return created;
    });

    return NextResponse.json({ status: "created", requestId, proposalId: proposal.id, proposalNumber: proposal.proposalNumber, publicToken: token }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    console.error("proposal_creation_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
