import { Prisma, OpportunityStage, ProposalStatus } from "@prisma/client";
import { after, NextResponse } from "next/server";
import { proposalAcceptSchema } from "@/lib/operations/contracts";
import { hashProposalToken } from "@/lib/commercial/security";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { recordGrowthEvent } from "@/lib/growth/events";
import { auditCommercialTransition, newCommercialToken, newId, newPaymentReference, recordOutboxEvent } from "@/lib/platform/lifecycle";
import { processOutboxBatch } from "@/lib/platform/outbox";

const MAX_BODY_BYTES = 8_192;
function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || `org-${Date.now()}`; }
function domainFromWebsite(website: string | null) { if (!website) return null; try { return new URL(website).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } }
function pricingValue(pricing: Prisma.JsonValue, key: string) { if (!pricing || typeof pricing !== "object" || Array.isArray(pricing)) return null; return (pricing as Record<string, Prisma.JsonValue>)[key] ?? null; }

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = await enforcePublicRateLimit(`proposal-accept:${getClientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });
  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const parsed = proposalAcceptSchema.safeParse(JSON.parse(bodyText));
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const proposal = await db.proposal.findUnique({ where: { publicTokenHash: hashProposalToken(parsed.data.token) }, include: { lead: true, versions: { orderBy: { version: "desc" }, take: 1 } } });
    if (!proposal) return NextResponse.json({ error: "proposal_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.status === ProposalStatus.ACCEPTED) { const existing = await db.$queryRaw<Array<{ id: string; status: string }>>`SELECT "id", "status" FROM "Invoice" WHERE "proposalId" = ${proposal.id} LIMIT 1`; return NextResponse.json({ status: "already_accepted", requestId, invoiceId: existing[0]?.id ?? null, invoiceStatus: existing[0]?.status ?? null }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    if (proposal.status !== ProposalStatus.SENT && proposal.status !== ProposalStatus.VIEWED) return NextResponse.json({ error: "proposal_not_accepting", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (proposal.expiresAt && proposal.expiresAt <= new Date()) { await db.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.EXPIRED } }); return NextResponse.json({ error: "proposal_expired", requestId }, { status: 410, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    const version = proposal.versions[0];
    if (!version || version.version !== proposal.currentVersion) return NextResponse.json({ error: "proposal_version_missing", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const totalMinor = pricingValue(version.pricing, "totalMinor"); const currencyValue = pricingValue(version.pricing, "currency"); const currency = typeof currencyValue === "string" ? currencyValue.toUpperCase() : "USD";
    if (typeof totalMinor !== "number" || !Number.isSafeInteger(totalMinor) || totalMinor <= 0) return NextResponse.json({ error: "proposal_not_payable", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const { token: paymentToken, hash: paymentHash } = newCommercialToken(); const paymentTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); const paymentReference = newPaymentReference(proposal.id);
    const result = await db.$transaction(async (tx) => {
      let organizationId = proposal.organizationId;
      if (!organizationId) { const domain = domainFromWebsite(proposal.lead.website); if (domain) organizationId = (await tx.organization.findUnique({ where: { websiteDomain: domain }, select: { id: true } }))?.id ?? null; if (!organizationId) organizationId = (await tx.organization.findFirst({ where: { name: { equals: proposal.lead.organizationName, mode: "insensitive" } }, select: { id: true } }))?.id ?? null; if (!organizationId) organizationId = (await tx.organization.create({ data: { name: proposal.lead.organizationName, slug: slugify(proposal.lead.organizationName), websiteDomain: domain }, select: { id: true } })).id; }
      const existingInvoice = await tx.$queryRaw<Array<{ id: string; status: string }>>`SELECT "id", "status" FROM "Invoice" WHERE "proposalId" = ${proposal.id} LIMIT 1`;
      if (existingInvoice[0]) return { organizationId, invoiceId: existingInvoice[0].id, invoiceStatus: existingInvoice[0].status, paymentToken: null };
      const invoiceId = newId();
      await tx.$executeRaw`INSERT INTO "Invoice" ("id", "organizationId", "proposalId", "customerEmail", "currency", "amountMinor", "description", "status", "externalId", "paymentAccessRequired", "dueAt") VALUES (${invoiceId}, ${organizationId}, ${proposal.id}, ${proposal.lead.email}, ${currency}, ${totalMinor}, ${`Proposal ${proposal.proposalNumber} — ${proposal.title}`}, 'sent', ${paymentReference}, TRUE, ${proposal.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})`;
      await tx.$executeRaw`INSERT INTO "CommercialToken" ("id", "kind", "entityId", "tokenHash", "expiresAt") VALUES (${newId()}, 'payment', ${invoiceId}, ${paymentHash}, ${paymentTokenExpiresAt})`;
      await tx.proposal.update({ where: { id: proposal.id }, data: { status: ProposalStatus.ACCEPTED, acceptedAt: new Date(), acceptedByName: parsed.data.acceptedByName, acceptedByEmail: parsed.data.acceptedByEmail, organizationId } });
      if (proposal.opportunityId) await tx.opportunity.update({ where: { id: proposal.opportunityId }, data: { organizationId, stage: OpportunityStage.ENGAGEMENT_PENDING, lastActivityAt: new Date(), nextAction: "Collect payment", nextActionAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      await auditCommercialTransition({ organizationId, action: "proposal.accepted", resourceType: "proposal", resourceId: proposal.id, requestId, previousState: proposal.status, newState: ProposalStatus.ACCEPTED, metadata: { acceptedVersion: proposal.currentVersion, acceptedByEmail: parsed.data.acceptedByEmail }, tx });
      await auditCommercialTransition({ organizationId, action: "invoice.created", resourceType: "invoice", resourceId: invoiceId, requestId, newState: "sent", metadata: { proposalId: proposal.id, amountMinor: totalMinor, currency }, tx });
      await recordOutboxEvent({ eventKey: `proposal.accepted:${proposal.id}:${proposal.currentVersion}`, eventType: "proposal.accepted", aggregateType: "proposal", aggregateId: proposal.id, organizationId, payload: { proposalId: proposal.id, version: proposal.currentVersion, invoiceId }, tx });
      await recordOutboxEvent({ eventKey: `invoice.created:${invoiceId}`, eventType: "invoice.created", aggregateType: "invoice", aggregateId: invoiceId, organizationId, payload: { invoiceId, proposalId: proposal.id }, tx });
      return { organizationId, invoiceId, invoiceStatus: "sent", paymentToken };
    });
    if (!result.paymentToken) return NextResponse.json({ status: "already_accepted", requestId, invoiceId: result.invoiceId, invoiceStatus: result.invoiceStatus }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    try { await recordGrowthEvent({ eventName: "proposal_accepted", source: "proposal", entityId: proposal.id, privacyClass: "FINANCIAL", properties: { invoiceId: result.invoiceId } }); await recordGrowthEvent({ eventName: "deal_won", source: "proposal", entityId: proposal.id, privacyClass: "FINANCIAL" }); } catch (error) { console.error("growth_event_record_failed", { requestId, error }); }
    const paymentUrl = new URL(`/pay/${result.paymentToken}`, request.url).toString();
    await recordOutboxEvent({ eventKey: `email.proposal.accepted:${proposal.id}:${proposal.currentVersion}`, eventType: "email.proposal.accepted", aggregateType: "proposal", aggregateId: proposal.id, organizationId: result.organizationId, payload: { recipient: proposal.lead.email, proposalNumber: proposal.proposalNumber, proposalTitle: proposal.title, invoiceId: result.invoiceId, paymentUrl } });
    after(() => processOutboxBatch().catch((error) => console.error("outbox_after_failed", { requestId, error })));
    return NextResponse.json({ status: "accepted", requestId, invoiceId: result.invoiceId, invoiceStatus: result.invoiceStatus, paymentUrl, notification: { queued: true } }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "commercial_identity_conflict", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("proposal_acceptance_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
