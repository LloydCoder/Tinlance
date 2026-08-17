import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { assessmentBookingSchema } from "@/lib/operations/contracts";
import { getRequestId } from "@/lib/security/request-id";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { validateProductionEnv } from "@/lib/security/env";

const MAX_BODY_BYTES = 16_384;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;

  if (idempotencyKey && idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return NextResponse.json(
      { error: "invalid_idempotency_key", requestId },
      {
        status: 400,
        headers: { "cache-control": "no-store", "x-request-id": requestId },
      },
    );
  }

  try {
    validateProductionEnv();
    const limit = await enforcePublicRateLimit(
      `booking:${getClientIp(request)}`,
    );
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "rate_limited", requestId },
        {
          status: 429,
          headers: {
            "cache-control": "no-store",
            "retry-after": String(limit.retryAfter ?? 60),
            "x-request-id": requestId,
            "x-ratelimit-remaining": "0",
          },
        },
      );
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "payload_too_large", requestId },
        {
          status: 413,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    const body = (() => {
      try {
        return JSON.parse(bodyText) as Record<string, unknown>;
      } catch {
        return null;
      }
    })();

    if (!body) {
      return NextResponse.json(
        { error: "invalid_json", requestId },
        {
          status: 400,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    const parsed = assessmentBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", requestId },
        {
          status: 400,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    const startsAt = new Date(parsed.data.startsAt);
    if (
      !Number.isFinite(startsAt.getTime()) ||
      startsAt.getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: "invalid_start_time", requestId },
        {
          status: 400,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    let result: { id: string; duplicate: boolean };

    try {
      result = await db.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.booking.findUnique({
            where: { idempotencyKey },
            select: { id: true },
          });
          if (existing) return { id: existing.id, duplicate: true };
        }

        const created = await tx.booking.create({
          data: {
            organizationName: parsed.data.organizationName,
            contactName: parsed.data.contactName,
            email: parsed.data.email,
            startsAt,
            timezone: parsed.data.timezone,
            notes: parsed.data.notes,
            source: "website",
            idempotencyKey,
          },
          select: { id: true },
        });

        await tx.auditEvent.create({
          data: {
            action: "booking.created",
            resourceType: "booking",
            resourceId: created.id,
            requestId,
            metadata: { source: "website" },
          },
        });

        return { id: created.id, duplicate: false };
      });
    } catch (error) {
      if (
        idempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await db.booking.findUnique({
          where: { idempotencyKey },
          select: { id: true },
        });
        if (!existing) throw error;
        result = { id: existing.id, duplicate: true };
      } else {
        throw error;
      }
    }

    return NextResponse.json(
      {
        status: "accepted",
        requestId,
        bookingId: result.id,
        nextStep: "assessment_confirmation",
        duplicate: result.duplicate,
      },
      {
        status: 202,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
          "x-ratelimit-remaining": String(limit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("booking_submission_failed", { requestId, error });
    return NextResponse.json(
      { error: "service_unavailable", requestId },
      {
        status: 503,
        headers: { "cache-control": "no-store", "x-request-id": requestId },
      },
    );
  }
}
