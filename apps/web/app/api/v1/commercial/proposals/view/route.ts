import { NextResponse } from "next/server";
import { ProposalStatus } from "@prisma/client";
import { hashProposalToken } from "@/lib/commercial/security";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token || token.length < 32 || token.length > 128) return NextResponse.json({ error: "invalid_token", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const proposal = await db.proposal.findUnique({ where: { publicTokenHash: hashProposalToken(token) }, include: { versions: { orderBy: { version: "desc" }, take: 1 } } });
  if (!proposal) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (proposal.expiresAt && proposal.expiresAt <= new Date()) {
    await db.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.EXPIRED } });
    return NextResponse.json({ error: "expired", requestId }, { status: 410, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
  if (proposal.status === ProposalStatus.SENT) {
    await db.$transaction(async (tx) => {
      await tx.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.VIEWED, viewedAt: new Date() } });
      await tx.auditEvent.create({ data: { organizationId: proposal.organizationId, action: "proposal.viewed", resourceType: "proposal", resourceId: proposal.id, requestId, metadata: { version: proposal.currentVersion } } });
    });
  }
  const version = proposal.versions[0];
  return NextResponse.json({ proposal: { id: proposal.id, number: proposal.proposalNumber, title: proposal.title, status: proposal.status === ProposalStatus.SENT ? ProposalStatus.VIEWED : proposal.status, expiresAt: proposal.expiresAt, acceptedAt: proposal.acceptedAt, version: version ? { version: version.version, executiveSummary: version.executiveSummary, problemDefinition: version.problemDefinition, proposedSolution: version.proposedSolution, scope: version.scope, deliverables: version.deliverables, assumptions: version.assumptions, exclusions: version.exclusions, timeline: version.timeline, milestones: version.milestones, pricing: version.pricing, paymentSchedule: version.paymentSchedule, dependencies: version.dependencies, securityConsiderations: version.securityConsiderations, acceptanceTerms: version.acceptanceTerms } : null } }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
