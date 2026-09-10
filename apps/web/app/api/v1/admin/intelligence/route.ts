import { NextResponse } from "next/server";
import { getAuthorizationContext } from "@/lib/auth/authorization";
import { getRequestId } from "@/lib/security/request-id";
import { createCandidate, listApprovedPublic, publishCandidate, reviewCandidate, revokeCandidate } from "@/lib/intelligence/m13";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = (requestId: string) => ({ "cache-control": "no-store", "x-request-id": requestId });

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: jsonHeaders(requestId) });
  if (!context.isPrivileged || !context.organizationId || !context.userId) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: jsonHeaders(requestId) });
  try {
    const url = new URL(request.url);
    const data = await listApprovedPublic({ userId: context.userId, organizationId: context.organizationId, requestId, category: url.searchParams.get("category") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 20) });
    return NextResponse.json({ data }, { headers: jsonHeaders(requestId) });
  } catch (error) {
    console.error("m13_intelligence_get_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: jsonHeaders(requestId) });
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: jsonHeaders(requestId) });
  if (!context.isPrivileged || !context.organizationId || !context.userId) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: jsonHeaders(requestId) });
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const principal = { userId: context.userId, organizationId: context.organizationId, requestId };
    if (action === "create_candidate") {
      if (typeof body.engagementId !== "string" || typeof body.category !== "string" || typeof body.content !== "string") return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: jsonHeaders(requestId) });
      const result = await createCandidate({ ...principal, engagementId: body.engagementId, category: body.category, content: body.content, purpose: typeof body.purpose === "string" ? body.purpose : undefined, contractualBasis: typeof body.contractualBasis === "string" ? body.contractualBasis : undefined, aggregationAllowed: body.aggregationAllowed === true, commercialReuseAllowed: body.commercialReuseAllowed === true });
      return NextResponse.json(result, { status: 201, headers: jsonHeaders(requestId) });
    }
    if (action === "review") {
      if (typeof body.candidateId !== "string" || (body.decision !== "APPROVE" && body.decision !== "REJECT")) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: jsonHeaders(requestId) });
      const result = await reviewCandidate({ ...principal, candidateId: body.candidateId, decision: body.decision, scope: body.scope === "PUBLIC" || body.scope === "LIMITED" || body.scope === "CUSTOMER_SAFE" || body.scope === "INTERNAL" ? body.scope : undefined, purpose: typeof body.purpose === "string" ? body.purpose : undefined, destination: Array.isArray(body.destination) && body.destination.every((v) => typeof v === "string") ? body.destination as string[] : undefined });
      return NextResponse.json(result, { headers: jsonHeaders(requestId) });
    }
    if (action === "publish") {
      if (typeof body.candidateId !== "string" || !["M10", "M11", "M12"].includes(String(body.destination))) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: jsonHeaders(requestId) });
      const result = await publishCandidate({ ...principal, candidateId: body.candidateId, destination: body.destination as "M10" | "M11" | "M12" });
      return NextResponse.json(result, { status: 201, headers: jsonHeaders(requestId) });
    }
    if (action === "revoke") {
      if (typeof body.candidateId !== "string" || typeof body.reason !== "string" || body.reason.length < 3 || body.reason.length > 1000) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: jsonHeaders(requestId) });
      const result = await revokeCandidate({ ...principal, candidateId: body.candidateId, reason: body.reason });
      return NextResponse.json(result, { headers: jsonHeaders(requestId) });
    }
    return NextResponse.json({ error: "unsupported_action", requestId }, { status: 400, headers: jsonHeaders(requestId) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    const policyErrors = new Set(["m13_policy_denied", "m13_permission_required", "m13_public_permission_denied", "m13_public_risk_blocked", "m13_public_cohort_too_small", "m13_not_approved", "m13_approval_invalid", "m13_m11_public_only", "m13_high_risk_publish_blocked", "m13_secret_detected", "m13_deidentification_failed"]);
    const status = policyErrors.has(message) ? 403 : ["m13_source_not_found", "m13_candidate_not_found"].includes(message) ? 404 : 400;
    return NextResponse.json({ error: message, requestId }, { status, headers: jsonHeaders(requestId) });
  }
}
