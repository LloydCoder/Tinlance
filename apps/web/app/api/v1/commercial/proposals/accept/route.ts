import { Prisma, OpportunityStage, ProposalStatus, EngagementStatus, DeliveryModel } from "@prisma/client";
import { NextResponse } from "next/server";
import { proposalAcceptSchema } from "@/lib/operations/contracts";
import { createProposalToken, hashProposalToken } from "@/lib/commercial/security";
import { sendCommercialEmail } from "@/lib/commercial/notifications";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";

const MAX_BODY_BYTES = 8_192;
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || `org-${Date.now()}`; }
function domainFromWebsite(website: string | null) { if (!website) return null; try { return new URL(website).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } }

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = await enforcePublicRateLimit(`proposal-accept:${getClientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const parsed = proposalAcceptSchema.safeParse(JSON.parse(bodyText));
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const proposal = await db.proposal.findUnique({ where: { publicTokenHash: hashProposalToken(parsed.data.token) }, include: { lead: true, versions: { where: { version: { equals: 1 } }, take: 1 } } });
    if (!proposal) return NextResponse.json({ error: "proposal_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.status === ProposalStatus.ACCEPTED) return NextResponse.json({ status: "already_accepted", requestId, engagementId: (await db.engagement.findUnique({ where: { proposalId: proposal.id }, select: { id: true } }))?.id ?? null }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.status !== ProposalStatus.SENT && proposal.status !== ProposalStatus.VIEWED) return NextResponse.json({ error: "proposal_not_accepting", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.expiresAt && proposal.expiresAt <= new Date()) { await db.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.EXPIRED } }); return NextResponse.json({ error: "proposal_expired", requestId }, { status: 410, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    const version = proposal.versions[0];
    if (!version) return NextResponse.json({ error: "proposal_version_missing", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const { token: onboardingToken, hash: onboardingHash } = createProposalToken();
    const onboardingExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const result = await db.$transaction(async (tx) => {
      let organizationId = proposal.organizationId;
      if (!organizationId) {
        const domain = domainFromWebsite(proposal.lead.website);
        if (domain) organizationId = (await tx.organization.findUnique({ where: { websiteDomain: domain }, select: { id: true } }))?.id ?? null;
        if (!organizationId) organizationId = (await tx.organization.findFirst({ where: { name: { equals: proposal.lead.organizationName, mode: "insensitive" } }, select: { id: true } }))?.id ?? null;
        if (!organizationId) organizationId = (await tx.organization.create({ data: { name: proposal.lead.organizationName, slug: slugify(proposal.lead.organizationName), websiteDomain: domain }, select: { id: true } })).id;
      }
      const client = await tx.client.upsert({ where: { organizationId }, update: { status: "active", onboardedAt: new Date() }, create: { organizationId, status: "active", onboardedAt: new Date() }, select: { id: true } });
      const existingEngagement = await tx.engagement.findUnique({ where: { proposalId: proposal.id }, select: { id: true, organizationId: true, clientId: true } });
      if (existingEngagement) return { ...existingEngagement, onboardingToken, onboardingCreated: false };
      const totalMinor = typeof version.pricing === "object" && version.pricing && "totalMinor" in version.pricing && typeof (version.pricing as { totalMinor?: unknown }).totalMinor === "number" ? (version.pricing as { totalMinor: number }).totalMinor : null;
      const currency = typeof version.pricing === "object" && version.pricing && "currency" in version.pricing && typeof (version.pricing as { currency?: unknown }).currency === "string" ? (version.pricing as { currency: string }).currency : "USD";
      const created = await tx.engagement.create({ data: { organizationId, clientId: client.id, opportunityId: proposal.opportunityId, proposalId: proposal.id, name: proposal.title, scope: `${version.proposedSolution}\n\nScope:\n${JSON.stringify(version.scope)}`, commercialValueMinor: totalMinor, currency, deliveryModel: DeliveryModel.PROJECT, status: EngagementStatus.ACTIVE, securityRequirements: version.securityConsiderations ?? null, projects: { create: { organizationId, name: proposal.title, type: "commercial-engagement", status: "active", progress: 0, description: version.executiveSummary } } }, select: { id: true, organizationId: true, clientId: true } });
      await tx.clientAccessInvite.create({ data: { clientId: client.id, email: proposal.lead.email, tokenHash: onboardingHash, expiresAt: onboardingExpiresAt } });
      await tx.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.ACCEPTED, acceptedAt: new Date(), acceptedByName: parsed.data.acceptedByName, acceptedByEmail: parsed.data.acceptedByEmail, organizationId } });
      if (proposal.opportunityId) await tx.opportunity.update({ where: { id: proposal.opportunityId }, data: { organizationId, stage: OpportunityStage.ACTIVE, lastActivityAt: new Date(), nextAction: "Begin client onboarding", nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      await tx.auditEvent.createMany({ data: [
        { organizationId, action: "proposal.accepted", resourceType: "proposal", resourceId: proposal.id, requestId, metadata: { acceptedByEmail: parsed.data.acceptedByEmail, version: proposal.currentVersion } },
        { organizationId, action: "engagement.created", resourceType: "engagement", resourceId: created.id, requestId, metadata: { proposalId: proposal.id, deliveryModel: DeliveryModel.PROJECT, commercialValueMinor: totalMinor, currency } },
        { organizationId, action: "client.onboarding_initiated", resourceType: "client", resourceId: client.id, requestId, metadata: { email: proposal.lead.email, expiresAt: onboardingExpiresAt.toISOString() } },
      ] });
      return { ...created, onboardingToken, onboardingCreated: true };
    });
    const onboardingUrl = new URL(`/client-onboarding/${result.onboardingToken}`, request.url).toString();
    const email = await sendCommercialEmail({ action: "proposal.accepted", resourceId: proposal.id, to: proposal.lead.email, subject: `Tinlance engagement created — ${proposal.title}`, html: `<p>Thank you. Your proposal <strong>${proposal.proposalNumber}</strong> has been accepted.</p><p>Your secure client workspace is ready to activate. <a href="${onboardingUrl}">Complete client access setup</a>.</p>`, requestId, organizationId: result.organizationId }).catch((error) => { console.error("acceptance_notification_failed", { requestId, error }); return { sent: false, duplicate: false, configured: false }; });
    return NextResponse.json({ status: "accepted", requestId, engagementId: result.id, organizationId: result.organizationId, clientId: result.clientId, onboardingUrl, notification: email }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "organization_identity_conflict", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("proposal_acceptance_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
