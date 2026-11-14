import { OpportunityStage, ProposalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { requirePrivileged } from "@/lib/auth/authorization";
import { getRequestId } from "@/lib/security/request-id";
import { db } from "@/lib/db";
import { proposalVersionSchema } from "@/lib/operations/contracts";

export async function POST(request: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const requestId = getRequestId(request);
  const actor = await requirePrivileged();
  if (!actor) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  try {
    const { proposalId } = await params;
    const parsed = proposalVersionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      select: { id: true, organizationId: true, currentVersion: true, status: true, opportunityId: true },
    });
    if (!proposal) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if ([ProposalStatus.ACCEPTED, ProposalStatus.DECLINED, ProposalStatus.EXPIRED].includes(proposal.status)) {
      return NextResponse.json({ error: "proposal_immutable", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }

    const nextVersion = proposal.currentVersion + 1;
    const created = await db.$transaction(async (tx) => {
      const claimed = await tx.proposal.updateMany({
        where: {
          id: proposalId,
          currentVersion: proposal.currentVersion,
          status: { in: [ProposalStatus.DRAFT, ProposalStatus.INTERNAL_REVIEW, ProposalStatus.SENT, ProposalStatus.VIEWED] },
        },
        data: { currentVersion: nextVersion, status: ProposalStatus.DRAFT },
      });
      if (claimed.count !== 1) throw new Error("proposal_version_race");

      const version = await tx.proposalVersion.create({
        data: { proposalId, version: nextVersion, ...parsed.data, createdByUserId: actor.userId },
      });
      if (proposal.opportunityId) {
        await tx.opportunity.update({
          where: { id: proposal.opportunityId },
          data: {
            stage: OpportunityStage.PROPOSAL_DRAFT,
            lastActivityAt: new Date(),
            nextAction: "Review revised proposal",
            nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
      await tx.auditEvent.create({
        data: {
          organizationId: proposal.organizationId,
          actorUserId: actor.userId,
          action: "proposal.version_created",
          resourceType: "proposal",
          resourceId: proposalId,
          requestId,
          metadata: { version: nextVersion },
        },
      });
      return version;
    });

    return NextResponse.json({ status: "created", requestId, proposalId, version: created.version }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (error instanceof Error && error.message === "proposal_version_race") return NextResponse.json({ error: "proposal_state_changed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("proposal_version_creation_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
