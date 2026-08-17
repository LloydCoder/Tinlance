import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaystackSignature } from "@/lib/operations/paystack";
import { getRequestId } from "@/lib/security/request-id";

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

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const jsonHeaders = {
    "cache-control": "no-store",
    "x-request-id": requestId,
  } as const;

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
  const eventId = String(body.data.id ?? body.data.reference ?? "");
  const reference = typeof body.data.reference === "string" ? body.data.reference : null;

  if (!eventId) {
    return NextResponse.json(
      { error: "missing_event_id", requestId },
      { status: 400, headers: jsonHeaders },
    );
  }

  const nextStatus = STATUS_BY_EVENT[eventType];

  try {
    await db.$transaction(async (tx) => {
      // The unique provider/eventId constraint makes delivery idempotent while
      // keeping event recording and invoice application atomic.
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

      const invoice = await tx.invoice.findFirst({ where: { externalId: reference } });
      if (!invoice) {
        await tx.auditEvent.create({
          data: {
            action: `paystack.${eventType}.unmatched`,
            resourceType: "webhook",
            resourceId: eventId,
            requestId,
            metadata: { reference, eventType },
          },
        });
        return;
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: nextStatus },
      });
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
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
