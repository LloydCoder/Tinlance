import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { newId, recordOutboxEvent } from "@/lib/platform/lifecycle";
import { validateProductionEnv } from "@/lib/security/env";
import { Prisma } from "@prisma/client";

const MAX_BODY_BYTES = 4_096;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try { validateProductionEnv({ billing: true }); } catch { return NextResponse.json({ error: "billing_not_configured", requestId }, { status: 503 }); }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413 });
    const body = JSON.parse(bodyText) as { token?: unknown };
    if (typeof body.token !== "string" || body.token.length < 32 || body.token.length > 256) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400 });

    const tokenHash = createHash("sha256").update(body.token).digest("hex");
    const token = await db.$queryRaw<Array<{ entityId: string; expiresAt: Date; consumedAt: Date | null }>>`
      SELECT "entityId", "expiresAt", "consumedAt" FROM "CommercialToken"
      WHERE "kind" = 'payment' AND "tokenHash" = ${tokenHash} LIMIT 1
    `;
    if (!token[0] || token[0].consumedAt || token[0].expiresAt <= new Date()) return NextResponse.json({ error: "payment_link_invalid", requestId }, { status: 404 });

    const invoiceRows = await db.$queryRaw<Array<{ id: string; organizationId: string; customerEmail: string | null; amountMinor: number; currency: string; status: string; externalId: string | null }>>`
      SELECT "id", "organizationId", "customerEmail", "amountMinor", "currency", "status", "externalId"
      FROM "Invoice" WHERE "id" = ${token[0].entityId} LIMIT 1
    `;
    const invoice = invoiceRows[0];
    if (!invoice || !invoice.customerEmail || !invoice.externalId) return NextResponse.json({ error: "invoice_not_payable", requestId }, { status: 409 });
    if (["paid", "refunded"].includes(invoice.status)) return NextResponse.json({ error: "invoice_already_settled", requestId }, { status: 409 });
    if (!Number.isSafeInteger(invoice.amountMinor) || invoice.amountMinor <= 0) return NextResponse.json({ error: "invalid_invoice_amount", requestId }, { status: 409 });

    const existing = await db.$queryRaw<Array<{ id: string; status: string; providerReference: string }>>`
      SELECT "id", "status", "providerReference" FROM "Payment" WHERE "invoiceId" = ${invoice.id} AND "provider" = 'paystack' ORDER BY "createdAt" DESC LIMIT 1
    `;
    const reference = existing[0]?.providerReference ?? invoice.externalId;
    if (!existing[0]) {
      await db.$executeRaw`
        INSERT INTO "Payment" ("id", "invoiceId", "organizationId", "provider", "providerReference", "status", "amountMinor", "currency")
        VALUES (${newId()}, ${invoice.id}, ${invoice.organizationId}, 'paystack', ${reference}, 'PENDING', ${invoice.amountMinor}, ${invoice.currency})
        ON CONFLICT ("providerReference") DO NOTHING
      `;
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return NextResponse.json({ error: "billing_not_configured", requestId }, { status: 503 });
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", "Idempotency-Key": `paystack-init:${invoice.id}` },
      body: JSON.stringify({ amount: invoice.amountMinor, currency: invoice.currency, email: invoice.customerEmail, reference, metadata: { invoiceId: invoice.id, organizationId: invoice.organizationId }, callback_url: new URL(`/payment/callback?reference=${encodeURIComponent(reference)}`, request.url).toString() }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as { status?: boolean; data?: { authorization_url?: string; reference?: string }; message?: string } | null;
    if (!response.ok || !payload?.status || !payload.data?.authorization_url) {
      await db.$executeRaw`UPDATE "Payment" SET "status" = 'FAILED', "failureReason" = ${String(payload?.message ?? `Paystack HTTP ${response.status}`).slice(0, 500)}, "updatedAt" = NOW() WHERE "providerReference" = ${reference}`;
      return NextResponse.json({ error: "payment_initialization_failed", requestId }, { status: 502 });
    }

    await db.$executeRaw`UPDATE "Payment" SET "status" = 'PENDING', "updatedAt" = NOW() WHERE "providerReference" = ${reference}`;
    await recordOutboxEvent({ eventKey: `payment.initialized:${invoice.id}:${reference}`, eventType: "payment.initialized", aggregateType: "payment", aggregateId: invoice.id, organizationId: invoice.organizationId, payload: { invoiceId: invoice.id, provider: "paystack", reference } });

    const acceptHtml = request.headers.get("accept")?.includes("text/html");
    if (acceptHtml) return NextResponse.redirect(payload.data.authorization_url, 303);
    return NextResponse.json({ authorizationUrl: payload.data.authorization_url, reference, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "invalid_json", requestId }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "payment_already_initialized", requestId }, { status: 409 });
    console.error("paystack_initialize_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503 });
  }
}
