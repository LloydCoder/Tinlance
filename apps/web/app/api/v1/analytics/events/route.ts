import { NextResponse } from "next/server";
import { growthEventSchema } from "@/lib/growth/event-contract";
import { recordGrowthEvent } from "@/lib/growth/events";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { getRequestId } from "@/lib/security/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "invalid_origin", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const limit = await enforcePublicRateLimit(`analytics:${getClientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });

  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    const parsed = growthEventSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    await recordGrowthEvent(parsed.data);
    return NextResponse.json({ status: "accepted", requestId }, { status: 202, headers: { "cache-control": "no-store", "x-request-id": requestId, "x-ratelimit-remaining": String(limit.remaining) } });
  } catch (error) {
    console.error("growth_event_ingestion_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
