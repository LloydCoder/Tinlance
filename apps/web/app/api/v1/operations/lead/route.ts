import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/operations/contracts";
import { getRequestId } from "@/lib/security/request-id";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { validateProductionEnv } from "@/lib/security/env";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    validateProductionEnv();
    const limit = await enforcePublicRateLimit(`lead:${getClientIp(request)}`);
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

    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { status: "accepted", requestId },
        {
          status: 202,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_request", requestId },
        {
          status: 400,
          headers: { "cache-control": "no-store", "x-request-id": requestId },
        },
      );
    }

    const lead = await db.lead.create({
      data: {
        organizationName: parsed.data.organizationName,
        contactName: parsed.data.contactName,
        email: parsed.data.email,
        country: parsed.data.country,
        service: parsed.data.service,
        notes: parsed.data.notes,
        status: parsed.data.status,
        source: "website",
      },
      select: { id: true },
    });

    await db.auditEvent.create({
      data: {
        action: "lead.created",
        resourceType: "lead",
        resourceId: lead.id,
        requestId,
        metadata: { source: "website" },
      },
    });

    return NextResponse.json(
      { status: "accepted", requestId, leadId: lead.id, nextStep: "lead_review" },
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
    console.error("lead_submission_failed", { requestId, error });
    return NextResponse.json(
      { error: "service_unavailable", requestId },
      {
        status: 503,
        headers: { "cache-control": "no-store", "x-request-id": requestId },
      },
    );
  }
}
