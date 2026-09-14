import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { sendCommercialEmail } from "@/lib/commercial/notifications";
import { auditCommercialTransition } from "@/lib/platform/lifecycle";
import { validateProductionEnv } from "@/lib/security/env";

const BATCH_SIZE = 20;
type OutboxRow = { id: string; eventKey: string; eventType: string; aggregateType: string; aggregateId: string; organizationId: string | null; payload: Record<string, unknown>; attempts: number };

async function claimBatch() {
  return db.$transaction(async (tx) => tx.$queryRaw<OutboxRow[]>`
    WITH candidates AS (
      SELECT "id" FROM "OutboxEvent"
      WHERE "status" = 'PENDING' AND "availableAt" <= NOW()
      ORDER BY "createdAt" LIMIT ${BATCH_SIZE} FOR UPDATE SKIP LOCKED
    )
    UPDATE "OutboxEvent" e
    SET "status" = 'PROCESSING', "attempts" = e."attempts" + 1, "updatedAt" = NOW()
    FROM candidates c WHERE e."id" = c."id"
    RETURNING e."id", e."eventKey", e."eventType", e."aggregateType", e."aggregateId", e."organizationId", e."payload", e."attempts"
  `);
}

async function markSuccess(event: OutboxRow) {
  await db.$executeRaw`UPDATE "OutboxEvent" SET "status" = 'PROCESSED', "processedAt" = NOW(), "updatedAt" = NOW(), "lastError" = NULL WHERE "id" = ${event.id}`;
}

async function markFailure(event: OutboxRow, error: unknown) {
  const message = String(error instanceof Error ? error.message : error).slice(0, 1000);
  const delaySeconds = Math.min(3600, 2 ** Math.min(event.attempts, 10));
  await db.$executeRaw`UPDATE "OutboxEvent" SET "status" = CASE WHEN "attempts" >= 10 THEN 'FAILED' ELSE 'PENDING' END, "availableAt" = NOW() + (${delaySeconds} * INTERVAL '1 second'), "lastError" = ${message}, "updatedAt" = NOW() WHERE "id" = ${event.id}`;
}

async function processEmail(event: OutboxRow) {
  const payload = event.payload;
  const recipient = typeof payload.recipient === "string" ? payload.recipient : null;
  if (!recipient) throw new Error("email_recipient_missing");
  let subject = "Tinlance notification";
  let html = "";
  const template = event.eventType;
  if (event.eventType === "email.proposal.accepted") {
    subject = `Proposal accepted — ${String(payload.proposalTitle ?? "your engagement")}`;
    html = `<p>Thank you. Your proposal <strong>${String(payload.proposalNumber ?? "proposal")}</strong> has been accepted.</p><p>Invoice <strong>${String(payload.invoiceId ?? "")}</strong> is ready for payment.</p><p><a href="${String(payload.paymentUrl ?? "")}">Continue to secure payment</a>.</p>`;
  } else if (event.eventType === "email.payment.succeeded") {
    subject = "Payment received — Tinlance";
    html = `<p>We have received your payment for invoice <strong>${String(payload.invoiceId ?? "")}</strong>.</p><p>Your Tinlance workspace is now being activated.</p>`;
  } else throw new Error(`unsupported_email_event:${event.eventType}`);

  const existing = await db.$queryRaw<Array<{ status: string }>>`SELECT "status" FROM "EmailDelivery" WHERE "eventKey" = ${event.eventKey} LIMIT 1`;
  if (existing[0]?.status === "SENT") return;
  await db.$executeRaw`INSERT INTO "EmailDelivery" ("id", "eventKey", "organizationId", "entityType", "entityId", "recipient", "template", "correlationId", "status", "attempts") VALUES (${randomUUID()}, ${event.eventKey}, ${event.organizationId}, ${event.aggregateType}, ${event.aggregateId}, ${recipient}, ${template}, ${event.eventKey}, 'SENDING', 1) ON CONFLICT ("eventKey") DO UPDATE SET "attempts" = "EmailDelivery"."attempts" + 1, "status" = 'SENDING', "updatedAt" = NOW()`;
  const result = await sendCommercialEmail({ action: event.eventType, resourceId: event.aggregateId, to: recipient, subject, html, requestId: event.eventKey, organizationId: event.organizationId });
  if (!result.sent && !result.duplicate) throw new Error("email_delivery_failed");
  await db.$executeRaw`UPDATE "EmailDelivery" SET "status" = 'SENT', "providerMessageId" = ${result.providerMessageId ?? null}, "updatedAt" = NOW() WHERE "eventKey" = ${event.eventKey}`;
}

async function processProvisioning(event: OutboxRow) {
  if (event.eventType !== "provisioning.requested") return;
  const entitlementId = event.aggregateId;
  const result = await db.$transaction(async (tx) => {
    const jobs = await tx.$queryRaw<Array<{ id: string; organizationId: string; status: string; attempts: number }>>`SELECT "id", "organizationId", "status", "attempts" FROM "ProvisioningJob" WHERE "entitlementId" = ${entitlementId} AND "idempotencyKey" = ${`provision:${entitlementId}`} LIMIT 1 FOR UPDATE`;
    const job = jobs[0];
    if (!job) throw new Error("provisioning_job_missing");
    if (job.status === "COMPLETED") return { projectId: null, alreadyComplete: true };
    await tx.$executeRaw`UPDATE "ProvisioningJob" SET "status" = 'RUNNING', "startedAt" = COALESCE("startedAt", NOW()), "updatedAt" = NOW() WHERE "id" = ${job.id}`;
    await tx.$executeRaw`UPDATE "Onboarding" SET "status" = 'PROVISIONING', "updatedAt" = NOW() WHERE "entitlementId" = ${entitlementId} AND "status" IN ('NOT_STARTED','READY_FOR_PROVISIONING','IN_PROGRESS','PROVISIONING')`;

    const context = await tx.$queryRaw<Array<{ organizationId: string; product: string; capability: string; invoiceId: string | null; engagementId: string | null; projectId: string | null }>>`
      SELECT e."organizationId", e."product", e."capability", e."invoiceId", i."engagementId", NULL::text AS "projectId"
      FROM "Entitlement" e LEFT JOIN "Invoice" i ON i."id" = e."invoiceId"
      WHERE e."id" = ${entitlementId} AND e."organizationId" = ${job.organizationId} AND e."status" = 'ACTIVE' LIMIT 1
    `;
    const item = context[0];
    if (!item) throw new Error("active_entitlement_missing");
    if (!item.engagementId) throw new Error("engagement_missing_for_provisioning");

    const existing = await tx.project.findFirst({ where: { organizationId: job.organizationId, engagementId: item.engagementId }, select: { id: true } });
    const project = existing ?? await tx.project.create({ data: { organizationId: job.organizationId, engagementId: item.engagementId, name: item.product, type: "commercial-engagement", status: "active", progress: 0 }, select: { id: true } });
    const workspace = await tx.projectWorkspaceState.findUnique({ where: { projectId: project.id }, select: { id: true } });
    if (!workspace) await tx.projectWorkspaceState.create({ data: { projectId: project.id, organizationId: job.organizationId, status: "ACTIVE", ownerUserId: null } });

    await tx.$executeRaw`UPDATE "ProvisioningJob" SET "status" = 'COMPLETED', "completedAt" = NOW(), "updatedAt" = NOW(), "lastError" = NULL WHERE "id" = ${job.id}`;
    await tx.$executeRaw`UPDATE "Onboarding" SET "status" = 'ACTIVE', "startedAt" = COALESCE("startedAt", NOW()), "updatedAt" = NOW() WHERE "entitlementId" = ${entitlementId}`;
    await auditCommercialTransition({ organizationId: job.organizationId, action: "provisioning.completed", resourceType: "project", resourceId: project.id, newState: "COMPLETED", metadata: { entitlementId, product: item.product }, tx });
    await auditCommercialTransition({ organizationId: job.organizationId, action: "onboarding.active", resourceType: "onboarding", resourceId: entitlementId, newState: "ACTIVE", metadata: { projectId: project.id }, tx });
    return { projectId: project.id, alreadyComplete: false };
  });
  if (!result.alreadyComplete) {
    await db.$executeRaw`INSERT INTO "OutboxEvent" ("id", "eventKey", "eventType", "aggregateType", "aggregateId", "organizationId", "payload") VALUES (${randomUUID()}, ${`provisioning.completed:${entitlementId}`}, 'provisioning.completed', 'entitlement', ${entitlementId}, ${event.organizationId}, ${JSON.stringify({ entitlementId, projectId: result.projectId })}::jsonb) ON CONFLICT ("eventKey") DO NOTHING`;
  }
}

export async function processOutboxBatch() {
  validateProductionEnv({ outbox: true });
  const events = await claimBatch();
  let processed = 0;
  let failed = 0;
  for (const event of events) {
    try {
      if (event.eventType.startsWith("email.")) await processEmail(event);
      else if (event.eventType === "provisioning.requested") await processProvisioning(event);
      await markSuccess(event);
      processed += 1;
    } catch (error) {
      if (event.eventType === "provisioning.requested") await db.$executeRaw`UPDATE "ProvisioningJob" SET "status" = 'FAILED', "lastError" = ${String(error instanceof Error ? error.message : error).slice(0, 1000)}, "updatedAt" = NOW() WHERE "idempotencyKey" = ${`provision:${event.aggregateId}`} AND "status" <> 'COMPLETED'`;
      await markFailure(event, error);
      failed += 1;
    }
  }
  return { claimed: events.length, processed, failed };
}
