import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type PaymentStatus = "CREATED" | "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" | "PARTIALLY_REFUNDED";
export type EntitlementStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED" | "REVOKED" | "CANCELLED";
export type ProvisioningStatus = "REQUESTED" | "RUNNING" | "COMPLETED" | "FAILED" | "BLOCKED";
export type OnboardingStatus = "NOT_STARTED" | "INVITED" | "IN_PROGRESS" | "CUSTOMER_ACTION_REQUIRED" | "INTERNAL_REVIEW" | "READY_FOR_PROVISIONING" | "PROVISIONING" | "ACTIVE" | "BLOCKED" | "FAILED" | "COMPLETED";

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newId() {
  return randomUUID();
}

export function newCommercialToken() {
  const token = `${randomUUID().replaceAll("-", "")}${randomUUID().replaceAll("-", "")}`;
  return { token, hash: hashSecret(token) };
}

export function newPaymentReference(invoiceId: string) {
  return `tl_${invoiceId}_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export async function recordOutboxEvent(input: {
  eventKey: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId?: string | null;
  payload: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? db;
  await client.$executeRaw`
    INSERT INTO "OutboxEvent" ("id", "eventKey", "eventType", "aggregateType", "aggregateId", "organizationId", "payload")
    VALUES (${newId()}, ${input.eventKey}, ${input.eventType}, ${input.aggregateType}, ${input.aggregateId}, ${input.organizationId ?? null}, ${JSON.stringify(input.payload)}::jsonb)
    ON CONFLICT ("eventKey") DO NOTHING
  `;
}

export async function auditCommercialTransition(input: {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId?: string | null;
  previousState?: string | null;
  newState?: string | null;
  metadata?: Record<string, unknown>;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? db;
  await client.auditEvent.create({
    data: {
      organizationId: input.organizationId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      requestId: input.requestId ?? null,
      metadata: {
        ...(input.metadata ?? {}),
        ...(input.previousState === undefined ? {} : { previousState: input.previousState }),
        ...(input.newState === undefined ? {} : { newState: input.newState }),
      },
    },
  });
}

export async function createEntitlement(input: {
  organizationId: string;
  product: string;
  capability: string;
  plan?: string | null;
  sourceType: string;
  sourceId: string;
  proposalId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  quantity?: number;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? db;
  const id = newId();
  await client.$executeRaw`
    INSERT INTO "Entitlement" ("id", "organizationId", "product", "capability", "plan", "sourceType", "sourceId", "proposalId", "invoiceId", "paymentId", "status", "quantity")
    VALUES (${id}, ${input.organizationId}, ${input.product}, ${input.capability}, ${input.plan ?? null}, ${input.sourceType}, ${input.sourceId}, ${input.proposalId ?? null}, ${input.invoiceId ?? null}, ${input.paymentId ?? null}, 'ACTIVE', ${input.quantity ?? 1})
    ON CONFLICT ("organizationId", "product", "capability", "sourceType", "sourceId")
    DO UPDATE SET "paymentId" = EXCLUDED."paymentId", "invoiceId" = EXCLUDED."invoiceId", "status" = 'ACTIVE', "updatedAt" = NOW()
  `;
  return id;
}

export async function requestProvisioning(input: {
  organizationId: string;
  entitlementId: string;
  product: string;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? db;
  const idempotencyKey = `provision:${input.entitlementId}`;
  const id = newId();
  await client.$executeRaw`
    INSERT INTO "ProvisioningJob" ("id", "organizationId", "entitlementId", "product", "status", "idempotencyKey")
    VALUES (${id}, ${input.organizationId}, ${input.entitlementId}, ${input.product}, 'REQUESTED', ${idempotencyKey})
    ON CONFLICT ("idempotencyKey") DO NOTHING
  `;
  await recordOutboxEvent({
    eventKey: idempotencyKey,
    eventType: "provisioning.requested",
    aggregateType: "entitlement",
    aggregateId: input.entitlementId,
    organizationId: input.organizationId,
    payload: { entitlementId: input.entitlementId, product: input.product },
    tx: input.tx,
  });
  return idempotencyKey;
}

export async function createOnboarding(input: {
  organizationId: string;
  entitlementId?: string | null;
  engagementId?: string | null;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? db;
  const id = newId();
  const rows = await client.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "Onboarding" ("id", "organizationId", "engagementId", "entitlementId", "status", "checklist")
    VALUES (${id}, ${input.organizationId}, ${input.engagementId ?? null}, ${input.entitlementId ?? null}, 'NOT_STARTED', '{}'::jsonb)
    RETURNING "id"
  `;
  return rows[0]?.id ?? id;
}

export async function transitionEntitlement(input: {
  entitlementId: string;
  nextStatus: EntitlementStatus;
  organizationId: string;
  requestId?: string | null;
}) {
  const rows = await db.$queryRaw<Array<{ status: EntitlementStatus }>>`
    UPDATE "Entitlement"
    SET "status" = ${input.nextStatus}, "updatedAt" = NOW()
    WHERE "id" = ${input.entitlementId} AND "organizationId" = ${input.organizationId}
    RETURNING "status"
  `;
  if (!rows[0]) throw new Error("entitlement_not_found");
  await auditCommercialTransition({
    organizationId: input.organizationId,
    action: `entitlement.${input.nextStatus.toLowerCase()}`,
    resourceType: "entitlement",
    resourceId: input.entitlementId,
    requestId: input.requestId,
    newState: input.nextStatus,
  });
  return rows[0];
}
