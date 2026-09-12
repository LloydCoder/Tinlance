import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/security/client-ip";
import { validateProductionEnv } from "@/lib/security/env";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { getRequestId } from "@/lib/security/request-id";
import { parseAssessmentInput, processAssessmentIntake } from "@/lib/commercial/assessment-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24_576;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;
const MIN_IDEMPOTENCY_KEY_LENGTH = 16;

function response(body: Record<string, unknown>, status: number, requestId: string, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store", "x-request-id": requestId, ...extra } });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || "";
  try {
    validateProductionEnv();
    if (!idempotencyKey || idempotencyKey.length < MIN_IDEMPOTENCY_KEY_LENGTH || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey)) return response({ error: "invalid_idempotency_key", requestId }, 400, requestId);
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return response({ error: "unsupported_content_type", requestId }, 415, requestId);
    const limit = await enforcePublicRateLimit(`assessment:${getClientIp(request)}`, "expensive");
    if (!limit.allowed) return response({ error: "rate_limited", requestId }, 429, requestId, { "retry-after": String(limit.retryAfter ?? 60) });
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return response({ error: "payload_too_large", requestId }, 413, requestId);
    let raw: unknown;
    try { raw = JSON.parse(bodyText); } catch { return response({ error: "invalid_json", requestId }, 400, requestId); }
    if (typeof raw === "object" && raw !== null && "websiteTrap" in raw && typeof (raw as Record<string, unknown>).websiteTrap === "string" && (raw as Record<string, unknown>).websiteTrap) return response({ status: "accepted", requestId }, 202, requestId);
    const parsed = parseAssessmentInput(raw);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fields[field]) fields[field] = "Please check this field.";
      }
      console.warn("assessment_input_rejected", { requestId, fieldCount: Object.keys(fields).length });
      return response({ error: "invalid_request", requestId, fields }, 400, requestId);
    }
    const result = await processAssessmentIntake(parsed.data, requestId, idempotencyKey);
    return response({
      status: "accepted",
      requestId,
      leadId: result.leadId,
      assessmentId: result.assessmentId,
      opportunityId: result.opportunityId,
      duplicate: result.duplicate,
      qualification: {
        status: result.qualification.status,
        nextAction: result.qualification.nextAction,
        message: result.qualification.status === "QUALIFIED"
          ? "Your assessment has enough signal for technical discovery."
          : "Your assessment has been received and needs additional qualification before technical discovery.",
      },
    }, 202, requestId, { "x-ratelimit-remaining": String(limit.remaining) });
  } catch (error) {
    console.error("assessment_submission_failed", { requestId, errorClass: error instanceof Error ? error.constructor.name : "unknown" });
    return response({ error: "service_unavailable", requestId }, 503, requestId);
  }
}
