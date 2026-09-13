import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystackEventId, verifyPaystackSignature } from "@/lib/operations/paystack";
import { getRequestId } from "@/lib/security/request-id";
import { validateProductionEnv } from "@/lib/security/env";
import { auditCommercialTransition, createOnboarding, newId, recordOutboxEvent, requestProvisioning } from "@/lib/platform/lifecycle";

const MAX_BODY_BYTES = 65_536;
const STATUS_BY_EVENT: Record<string, string> = { "charge.success": "paid", "charge.failed": "failed", "refund.processed": "refunded", "invoice.payment_failed": "failed" };
type PaystackPayload = { event?: string; data?: { id?: number | string; reference?: string; status?: string; amount?: number; currency?: string } };
function canTransition(current: string, next: string) { if (current === next) return true; if (current === "refunded") return false; if (current === "paid") return next === "refunded"; if (next === "refunded") return current === "paid"; if (next === "paid") return ["draft", "sent", "overdue", "failed"].includes(current); if (next === "failed") return ["draft", "sent", "overdue", "failed"].includes(current); return false; }

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const jsonHeaders = { "cache-control": "no-store", "x-request-id": requestId } as const;
  try { validateProductionEnv({ billing: true }); } catch { return NextResponse.json({ error: "billing_not_configured", requestId }, { status: 503, headers: jsonHeaders }); }
  const payload = await request.text();
  if (new TextEncoder().encode(payload).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: jsonHeaders });
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!verifyPaystackSignature(payload, signature, secret)) return NextResponse.json({ error: "invalid_signature", requestId }, { status: 401, headers: jsonHeaders });
  let body: PaystackPayload | null; try { body = JSON.parse(payload) as PaystackPayload; } catch { body = null; }
  if (!body || typeof body.event !== "string" || !body.data) return NextResponse.json({ error: "invalid_payload", requestId }, { status: 400, headers: jsonHeaders });
  const eventType = body.event; const data = body.data; const reference = typeof data.reference === "string" ? data.reference : null; const eventId = paystackEventId(eventType, data.id, reference, payload); const nextStatus = STATUS_BY_EVENT[eventType];

  try {
    await db.$transaction(async (tx) => {
      try { await tx.webhookEvent.create({ data: { provider: "paystack", eventId, eventType } }); }
      catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("duplicate_webhook"); throw error; }
      if (!nextStatus || !reference) { await tx.auditEvent.create({ data: { action: `paystack.${eventType}`, resourceType: "webhook", resourceId: eventId, requestId, metadata: { reference, eventType } } }); return; }
      const invoices = await tx.invoice.findMany({ where: { externalId: reference }, take: 2, select: { id: true, organizationId: true, status: true, amountMinor: true, currency: true } });
      if (invoices.length !== 1) { await tx.auditEvent.create({ data: { action: `paystack.${eventType}.unmatched`, resourceType: "webhook", resourceId: eventId, requestId, metadata: { reference, eventType, matchCount: invoices.length } } }); return; }
      const invoice = invoices[0];
      const customerRows = await tx.$queryRaw<Array<{ customerEmail: string | null }>>`SELECT "customerEmail" FROM "Invoice" WHERE "id" = ${invoice.id} LIMIT 1`;
      const customerEmail = customerRows[0]?.customerEmail ?? null;
      if (typeof data.amount !== "number" || typeof data.currency !== "string" || data.amount !== invoice.amountMinor || data.currency.toUpperCase() !== invoice.currency.toUpperCase()) {
        await tx.auditEvent.create({ data: { organizationId: invoice.organizationId, action: `paystack.${eventType}.amount_mismatch`, resourceType: "invoice", resourceId: invoice.id, requestId, metadata: { eventId, reference, eventType, expectedAmount: invoice.amountMinor, receivedAmount: data.amount, expectedCurrency: invoice.currency, receivedCurrency: data.currency } } });
        await tx.$executeRaw`INSERT INTO "ReconciliationException" ("id", "organizationId", "invoiceId", "type", "details") VALUES (${newId()}, ${invoice.organizationId}, ${invoice.id}, 'AMOUNT_OR_CURRENCY_MISMATCH', ${JSON.stringify({ eventId, reference, eventType, receivedAmount: data.amount, receivedCurrency: data.currency })}::jsonb)`;
        return;
      }
      if (!canTransition(invoice.status, nextStatus)) { await tx.auditEvent.create({ data: { organizationId: invoice.organizationId, action: `paystack.${eventType}.invalid_transition`, resourceType: "invoice", resourceId: invoice.id, requestId, metadata: { eventId, reference, eventType, previousStatus: invoice.status, nextStatus } } }); return; }
      const providerTransactionId = data.id == null ? null : String(data.id);
      const paymentRows = await tx.$queryRaw<Array<{ id: string; status: string }>>`SELECT "id", "status" FROM "Payment" WHERE "provider" = 'paystack' AND "providerReference" = ${reference} LIMIT 1`;
      let paymentId = paymentRows[0]?.id ?? null;
      const paymentStatus = nextStatus === "paid" ? "SUCCEEDED" : nextStatus === "refunded" ? "REFUNDED" : "FAILED";
      if (!paymentId) { paymentId = newId(); await tx.$executeRaw`INSERT INTO "Payment" ("id", "invoiceId", "organizationId", "provider", "providerReference", "providerTransactionId", "status", "amountMinor", "currency", "lastProviderEventId") VALUES (${paymentId}, ${invoice.id}, ${invoice.organizationId}, 'paystack', ${reference}, ${providerTransactionId}, ${paymentStatus}, ${invoice.amountMinor}, ${invoice.currency}, ${eventId}) ON CONFLICT ("providerReference") DO UPDATE SET "providerTransactionId" = EXCLUDED."providerTransactionId", "status" = EXCLUDED."status", "lastProviderEventId" = EXCLUDED."lastProviderEventId", "updatedAt" = NOW()`; }
      else await tx.$executeRaw`UPDATE "Payment" SET "status" = ${paymentStatus}, "providerTransactionId" = COALESCE(${providerTransactionId}, "providerTransactionId"), "lastProviderEventId" = ${eventId}, "updatedAt" = NOW() WHERE "id" = ${paymentId}`;
      if (invoice.status !== nextStatus) await tx.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
      if (nextStatus === "paid") await tx.$executeRaw`UPDATE "Invoice" SET "paidAt" = NOW() WHERE "id" = ${invoice.id}`;
      await auditCommercialTransition({ organizationId: invoice.organizationId, action: `payment.${nextStatus === "paid" ? "succeeded" : nextStatus}`, resourceType: "payment", resourceId: paymentId, requestId, previousState: paymentRows[0]?.status ?? "CREATED", newState: paymentStatus, metadata: { provider: "paystack", reference, providerTransactionId }, tx });
      await auditCommercialTransition({ organizationId: invoice.organizationId, action: `invoice.${nextStatus}`, resourceType: "invoice", resourceId: invoice.id, requestId, previousState: invoice.status, newState: nextStatus, metadata: { reference, eventId }, tx });

      if (nextStatus === "paid") {
        const commercial = await tx.$queryRaw<Array<{ proposalId: string | null; title: string; pricing: unknown }>>`SELECT i."proposalId", p."title", pv."pricing" FROM "Invoice" i LEFT JOIN "Proposal" p ON p."id" = i."proposalId" LEFT JOIN "ProposalVersion" pv ON pv."proposalId" = p."id" AND pv."version" = p."currentVersion" WHERE i."id" = ${invoice.id} LIMIT 1`;
        const proposalId = commercial[0]?.proposalId ?? null;
        const pricing = commercial[0]?.pricing && typeof commercial[0]?.pricing === "object" ? commercial[0].pricing as Record<string, unknown> : {};
        const product = typeof pricing.product === "string" ? pricing.product : "FDE engagement";
        const capability = typeof pricing.capability === "string" ? pricing.capability : "fde-engagement";
        const entitlementId = newId();
        await tx.$executeRaw`INSERT INTO "Entitlement" ("id", "organizationId", "product", "capability", "sourceType", "sourceId", "proposalId", "invoiceId", "paymentId", "status") VALUES (${entitlementId}, ${invoice.organizationId}, ${product}, ${capability}, 'PAYMENT', ${paymentId}, ${proposalId}, ${invoice.id}, ${paymentId}, 'ACTIVE') ON CONFLICT ("organizationId", "product", "capability", "sourceType", "sourceId") DO UPDATE SET "status" = 'ACTIVE', "paymentId" = EXCLUDED."paymentId", "updatedAt" = NOW()`;
        const client = await tx.client.upsert({ where: { organizationId: invoice.organizationId }, update: { status: "active" }, create: { organizationId: invoice.organizationId, status: "active" }, select: { id: true } });
        const existingEngagement = proposalId ? await tx.engagement.findUnique({ where: { proposalId }, select: { id: true } }) : null;
        const engagement = existingEngagement ?? await tx.engagement.create({ data: { organizationId: invoice.organizationId, clientId: client.id, proposalId, name: commercial[0]?.title ?? product, scope: `Commercial fulfillment for invoice ${invoice.id}`, commercialValueMinor: invoice.amountMinor, currency: invoice.currency, deliveryModel: "PROJECT", status: "ACTIVE" }, select: { id: true } });
        const existingProject = await tx.project.findFirst({ where: { organizationId: invoice.organizationId, engagementId: engagement.id }, select: { id: true } });
        const project = existingProject ?? await tx.project.create({ data: { organizationId: invoice.organizationId, engagementId: engagement.id, name: commercial[0]?.title ?? product, type: "commercial-engagement", status: "active", progress: 0 }, select: { id: true } });
        const existingWorkspace = await tx.projectWorkspaceState.findUnique({ where: { projectId: project.id }, select: { id: true } });
        if (!existingWorkspace) await tx.projectWorkspaceState.create({ data: { projectId: project.id, organizationId: invoice.organizationId, status: "ACTIVE", ownerUserId: null } });
        const onboardingRows = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Onboarding" WHERE "entitlementId" = ${entitlementId} LIMIT 1`;
        if (!onboardingRows[0]) await createOnboarding({ organizationId: invoice.organizationId, entitlementId, engagementId: engagement.id, tx });
        await requestProvisioning({ organizationId: invoice.organizationId, entitlementId, product: "Tinlance Workspace", tx });
        await tx.$executeRaw`UPDATE "ProvisioningJob" SET "status" = 'COMPLETED', "attempts" = 1, "startedAt" = NOW(), "completedAt" = NOW(), "updatedAt" = NOW() WHERE "entitlementId" = ${entitlementId} AND "idempotencyKey" = ${`provision:${entitlementId}`}`;
        await tx.$executeRaw`UPDATE "Onboarding" SET "status" = 'ACTIVE', "startedAt" = COALESCE("startedAt", NOW()), "updatedAt" = NOW() WHERE "entitlementId" = ${entitlementId}`;
        await auditCommercialTransition({ organizationId: invoice.organizationId, action: "entitlement.activated", resourceType: "entitlement", resourceId: entitlementId, requestId, newState: "ACTIVE", metadata: { invoiceId: invoice.id, paymentId, product, capability }, tx });
        await auditCommercialTransition({ organizationId: invoice.organizationId, action: "provisioning.completed", resourceType: "project", resourceId: project.id, requestId, newState: "COMPLETED", metadata: { entitlementId, product: "Tinlance Workspace" }, tx });
        await recordOutboxEvent({ eventKey: `payment.succeeded:${paymentId}`, eventType: "payment.succeeded", aggregateType: "payment", aggregateId: paymentId, organizationId: invoice.organizationId, payload: { paymentId, invoiceId: invoice.id, entitlementId }, tx });
        if (customerEmail) await recordOutboxEvent({ eventKey: `email.payment.succeeded:${invoice.id}`, eventType: "email.payment.succeeded", aggregateType: "invoice", aggregateId: invoice.id, organizationId: invoice.organizationId, payload: { recipient: customerEmail, invoiceId: invoice.id }, tx });
        await recordOutboxEvent({ eventKey: `entitlement.activated:${entitlementId}`, eventType: "entitlement.created", aggregateType: "entitlement", aggregateId: entitlementId, organizationId: invoice.organizationId, payload: { entitlementId, invoiceId: invoice.id, paymentId }, tx });
        await recordOutboxEvent({ eventKey: `provisioning.completed:${entitlementId}`, eventType: "provisioning.completed", aggregateType: "entitlement", aggregateId: entitlementId, organizationId: invoice.organizationId, payload: { entitlementId, projectId: project.id }, tx });
        await recordOutboxEvent({ eventKey: `onboarding.started:${entitlementId}`, eventType: "onboarding.started", aggregateType: "entitlement", aggregateId: entitlementId, organizationId: invoice.organizationId, payload: { entitlementId, engagementId: engagement.id }, tx });
      } else if (nextStatus === "refunded") {
        await tx.$executeRaw`UPDATE "Entitlement" SET "status" = 'REVOKED', "updatedAt" = NOW() WHERE "paymentId" = ${paymentId} AND "status" = 'ACTIVE'`;
        await tx.$executeRaw`UPDATE "Onboarding" SET "status" = 'BLOCKED', "updatedAt" = NOW() WHERE "entitlementId" IN (SELECT "id" FROM "Entitlement" WHERE "paymentId" = ${paymentId})`;
        await recordOutboxEvent({ eventKey: `payment.refunded:${paymentId}`, eventType: "entitlement.revoked", aggregateType: "payment", aggregateId: paymentId, organizationId: invoice.organizationId, payload: { paymentId, invoiceId: invoice.id, reason: "refund.processed" }, tx });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "duplicate_webhook") return NextResponse.json({ received: true, duplicate: true, requestId }, { headers: jsonHeaders });
    console.error("paystack_webhook_processing_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: jsonHeaders });
  }
  return NextResponse.json({ received: true, requestId }, { headers: jsonHeaders });
}
