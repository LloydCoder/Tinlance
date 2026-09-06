import { Prisma, OpportunityStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { assessmentBookingSchema } from "@/lib/operations/contracts";
import { getRequestId } from "@/lib/security/request-id";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { validateProductionEnv } from "@/lib/security/env";
import { recordGrowthEvent } from "@/lib/growth/events";
import { db } from "@/lib/db";

const MAX_BODY_BYTES = 16_384;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;
function isBookableSlot(date: Date) { const day = date.getUTCDay(); const hour = date.getUTCHours(); const minute = date.getUTCMinutes(); return day !== 0 && day !== 6 && hour >= 9 && hour < 17 && minute % 30 === 0; }

export async function POST(request: Request) {
  const requestId = getRequestId(request); const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;
  if (idempotencyKey && idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) return NextResponse.json({ error: "invalid_idempotency_key", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try {
    validateProductionEnv(); const limit = await enforcePublicRateLimit(`booking:${getClientIp(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    let raw: unknown; try { raw = JSON.parse(bodyText); } catch { return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    const parsed = assessmentBookingSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const startsAt = new Date(parsed.data.startsAt);
    if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now() || !isBookableSlot(startsAt)) return NextResponse.json({ error: "slot_unavailable", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    let result: { id: string; duplicate: boolean; opportunityId: string | null };
    try {
      result = await db.$transaction(async (tx) => {
        if (idempotencyKey) { const existing = await tx.booking.findUnique({ where: { idempotencyKey }, select: { id: true, opportunityId: true } }); if (existing) return { id: existing.id, duplicate: true, opportunityId: existing.opportunityId }; }
        let leadId = parsed.data.leadId ?? null;
        const assessmentId = parsed.data.assessmentId ?? null;
        let opportunityId = parsed.data.opportunityId ?? null;
        if (assessmentId) {
          const assessment = await tx.assessment.findUnique({ where: { id: assessmentId }, select: { id: true, leadId: true, opportunity: { select: { id: true } }, lead: { select: { email: true } } } });
          if (!assessment || assessment.lead.email.toLowerCase() !== parsed.data.email.toLowerCase()) throw new Error("booking_assessment_mismatch");
          leadId = assessment.leadId; opportunityId = assessment.opportunity?.id ?? opportunityId;
        }
        if (leadId) { const lead = await tx.lead.findUnique({ where: { id: leadId }, select: { id: true, email: true } }); if (!lead || lead.email.toLowerCase() !== parsed.data.email.toLowerCase()) throw new Error("booking_lead_mismatch"); }
        if (opportunityId) { const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true, leadId: true, assessmentId: true } }); if (!opportunity || (leadId && opportunity.leadId !== leadId) || (assessmentId && opportunity.assessmentId !== assessmentId)) throw new Error("booking_opportunity_mismatch"); }
        const existingSlot = await tx.booking.findFirst({ where: { startsAt, status: { in: ["requested", "confirmed"] } }, select: { id: true, opportunityId: true } });
        if (existingSlot) return { id: existingSlot.id, duplicate: true, opportunityId: existingSlot.opportunityId };
        const created = await tx.booking.create({ data: { organizationName: parsed.data.organizationName, contactName: parsed.data.contactName, email: parsed.data.email, startsAt, timezone: parsed.data.timezone, notes: parsed.data.notes, source: "website", idempotencyKey, leadId, assessmentId, opportunityId }, select: { id: true } });
        if (opportunityId) await tx.opportunity.update({ where: { id: opportunityId }, data: { stage: OpportunityStage.BOOKED, lastActivityAt: new Date(), nextAction: "Complete technical assessment", nextActionAt: new Date(startsAt.getTime() + 24 * 60 * 60 * 1000) } });
        await tx.auditEvent.create({ data: { action: "booking.created", resourceType: "booking", resourceId: created.id, requestId, metadata: { source: "website", leadId, assessmentId, opportunityId, timezone: parsed.data.timezone } } });
        return { id: created.id, duplicate: false, opportunityId };
      });
    } catch (error) { if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { const existing = await db.booking.findUnique({ where: { idempotencyKey }, select: { id: true, opportunityId: true } }); if (!existing) throw error; result = { id: existing.id, duplicate: true, opportunityId: existing.opportunityId }; } else throw error; }
    if (!result.duplicate) { try { await recordGrowthEvent({ eventName: "booking_completed", source: "website", path: new URL(request.url).pathname, entityId: result.id, privacyClass: "PERSONAL" }); } catch (error) { console.error("growth_event_record_failed", { requestId, error }); } }
    return NextResponse.json({ status: "accepted", requestId, bookingId: result.id, opportunityId: result.opportunityId, nextStep: "assessment_confirmation", duplicate: result.duplicate }, { status: 202, headers: { "cache-control": "no-store", "x-request-id": requestId, "x-ratelimit-remaining": String(limit.remaining) } });
  } catch (error) { console.error("booking_submission_failed", { requestId, error }); return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
