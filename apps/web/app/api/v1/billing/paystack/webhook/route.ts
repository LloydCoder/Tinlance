import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paystackEventId, verifyPaystackSignature } from "@/lib/operations/paystack";
import { getRequestId } from "@/lib/security/request-id";
import { validateProductionEnv } from "@/lib/security/env";

const MAX_BODY_BYTES = 65_536;

const STATUS_BY_EVENT: Record<string, string> = {
  "charge.success": "paid",
  "charge.failed": "failed",
  "refund.processed": "refunded",
  "invoice.payment_failed": "failed",
};

type PaystackPayload = {
  event?: string;
  data?: {
    id?: number | string;
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
  };
};

function canTransition(current: string, next: string) {
  if (current === next) return true;
  if (current === "refunded") return false;
  if (current === "paid") return next === "refunded";
  if (next === "refunded") return current === "paid";
  if (next === "paid") return ["draft", "sent", "overdue", "failed"].includes(current);
  if (next === "failed") return ["draft", "sent", "overdue", "failed"].includes(current);
  return false;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const jsonHeaders = {
    "cache-control": "no-store",
    "x-request-id": requestId,
  } as const;

  try {
    validateProductionEnv({ billing: true });
  } catch {
    return NextResponse.json(
      { error: "billing_not_configured", requestId },
      { status: 503, headers: jsonHeaders },
    );
  }

  const payload = await request.text();
  if (new TextEncoder().encode(payload).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large", requestId },
      { status: 413, headers: jsonHeaders },
    );
  }

  const signature = request.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";

  if (!verifyPaystackSignature(payload, signature, secret)) {
    return NextResponse.json(
      { error: "invalid_signature", requestId },
      { status: 401, headers: jsonHeaders },
    );
  }

  let body: PaystackPayload | null;
  try {
    body = JSON.parse(payload) as PaystackPayload;
  } catch {
    body = null;
  }

  if (!body || typeof body.event !== "string" || !body.data) {
    return NextResponse.json(
      { error: "invalid_payload", requestId },
      { status: 400, headers: jsonHeaders },
    );
  }

  const eventType = body.event;
  const data = body.data;
  const reference = typeof data.reference === "string" ? data.reference : null;
  const eventId = paystackEventId(eventType, data.id, reference, payload);
  const nextStatus = STATUS_BY_EVENT[eventType];

  try {
    await db.$transaction(async (tx) => {
      await tx.webhookEvent.create({
        data: { provider: "paystack", eventId, eventType },
      });

      if (!nextStatus || !reference) {
        await tx.auditEvent.create({
          data: {
            action: `paystack.${eventType}`,
            resourceType: "webhook",
            resourceId: eventId,
            requestId,
            metadata: { reference, eventType },
          },
        });
        return;
      }

      const invoices = await tx.invoice.findMany({
        where: { externalId: reference },
        take: 2,
        select: {
          id: true,
          organizationId: true,
          status: true,
          amountMinor: true,
          currency: true,
        },
      });

      if (invoices.length !== 1) {
        await tx.auditEvent.create({
          data: {
            action: `paystack.${eventType}.unmatched`,
            resourceType: "webhook",
            resourceId: eventId,
            requestId,
            metadata: {
              reference,
              eventType,
              matchCount: invoices.length,
            },
          },
        });
        return;
      }

      const invoice = invoices[0];
      if (
        typeof data.amount !== "number" ||
        typeof data.currency !== "string" ||
        data.amount !== invoice.amountMinor ||
        data.currency.toUpperCase() !== invoice.currency.toUpperCase()
      ) {
        await tx.auditEvent.create({
          data: {
            organizationId: invoice.organizationId,
            action: `paystack.${eventType}.amount_mismatch`,
            resourceType: "invoice",
            resourceId: invoice.id,
            requestId,
            metadata: {
              eventId,
              reference,
              eventType,
              expectedAmount: invoice.amountMinor,
              receivedAmount: data.amount,
              expectedCurrency: invoice.currency,
              receivedCurrency: data.currency,
            },
          },
        });
        return;
      }

      if (!canTransition(invoice.status, nextStatus)) {
        await tx.auditEvent.create({
          data: {
            organizationId: invoice.organizationId,
            action: `paystack.${eventType}.invalid_transition`,
            resourceType: "invoice",
            resourceId: invoice.id,
            requestId,
            metadata: {
              eventId,
              reference,
              eventType,
              previousStatus: invoice.status,
              nextStatus,
            },
          },
        });
        return;
      }

      if (invoice.status !== nextStatus) {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: nextStatus },
        });
      }

      await tx.auditEvent.create({
        data: {
          organizationId: invoice.organizationId,
          action: `paystack.${eventType}`,
          resourceType: "invoice",
          resourceId: invoice.id,
          requestId,
          metadata: {
            eventId,
            reference,
            previousStatus: invoice.status,
            nextStatus,
          },
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { received: true, duplicate: true, requestId },
        { headers: jsonHeaders },
      );
    }

    console.error("paystack_webhook_processing_failed", { requestId, error });
    return NextResponse.json(
      { error: "service_unavailable", requestId },
      { status: 503, headers: jsonHeaders },
    );
  }

  return NextResponse.json(
    { received: true, requestId },
    { headers: jsonHeaders },
  );
}
