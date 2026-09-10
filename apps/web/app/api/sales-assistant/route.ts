import { NextResponse } from "next/server";
import { answerSalesQuestion, salesAssistantInput } from "@/lib/sales-assistant";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { getRequestId } from "@/lib/security/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_768;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = await enforcePublicRateLimit(`sales-assistant:${getClientIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "rate_limited", requestId },
      { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } },
    );
  }

  try {
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }
    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }
    const parsed = salesAssistantInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }

    const result = await answerSalesQuestion(parsed.data);
    console.info("sales_assistant_event", { requestId, event: "sales_assistant_response", intent: result.intent, citationCount: result.citations.length });
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
        "x-ratelimit-remaining": String(limit.remaining),
      },
    });
  } catch (error) {
    console.error("sales_assistant_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
