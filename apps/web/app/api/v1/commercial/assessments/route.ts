import { Prisma, OpportunityStage, QualificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { assessmentSchema } from "@/lib/operations/contracts";
import { qualifyAssessment } from "@/lib/commercial/qualification";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";
import { validateProductionEnv } from "@/lib/security/env";
import { recordGrowthEvent } from "@/lib/growth/events";

const MAX_BODY_BYTES = 24_576;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

function domainFromWebsite(website?: string) { if (!website) return null; try { return new URL(website).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } }

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;
  if (idempotencyKey && idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) return NextResponse.json({ error: "invalid_idempotency_key", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try {
    validateProductionEnv();
    const limit = await enforcePublicRateLimit(`assessment:${getClientIp(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });
    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: "payload_too_large", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    let raw: unknown; try { raw = JSON.parse(bodyText); } catch { return NextResponse.json({ error: "invalid_json", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
    if (typeof raw === "object" && raw && "websiteTrap" in raw && typeof (raw as Record<string, unknown>).websiteTrap === "string" && (raw as Record<string, unknown>).websiteTrap) return NextResponse.json({ status: "accepted", requestId }, { status: 202, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const parsed = assessmentSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const qualification = qualifyAssessment({
      problem: parsed.data.problem,
      workflow: parsed.data.workflow ?? null,
      currentArchitecture: parsed.data.currentArchitecture ?? null,
      constraints: parsed.data.constraints ?? null,
      desiredOutcome: parsed.data.desiredOutcome,
      urgency: parsed.data.urgency ?? null,
      stakeholders: parsed.data.stakeholders ?? null,
      existingSystems: parsed.data.existingSystems ?? null,
      securityRequirements: parsed.data.securityRequirements ?? null,
      businessImpact: parsed.data.businessImpact ?? null,
      budgetSignal: parsed.data.budgetSignal ?? null,
      companySize: parsed.data.companySize ?? null,
      roleTitle: parsed.data.roleTitle ?? null,
      technicalEnvironment: parsed.data.technicalEnvironment ?? null,
      securitySensitivity: parsed.data.securitySensitivity ?? null,
    });
    const domain = domainFromWebsite(parsed.data.website);
    const nextActionAt = new Date(Date.now() + (qualification.status === "QUALIFIED" ? 24 : 72) * 60 * 60 * 1000);
    let result: { leadId: string; assessmentId: string; opportunityId: string; duplicate: boolean };
    try {
      result = await db.$transaction(async (tx) => {
        if (idempotencyKey) {
          const existing = await tx.assessment.findUnique({ where: { idempotencyKey }, select: { id: true, leadId: true, opportunity: { select: { id: true } } } });
          if (existing?.opportunity) return { leadId: existing.leadId, assessmentId: existing.id, opportunityId: existing.opportunity.id, duplicate: true };
        }
        const lead = await tx.lead.create({ data: { organizationName: parsed.data.organizationName, contactName: parsed.data.contactName, email: parsed.data.email, country: parsed.data.country, service: parsed.data.capability, source: parsed.data.source, campaign: parsed.data.campaign, referral: parsed.data.referral, roleTitle: parsed.data.roleTitle, companySize: parsed.data.companySize, website: parsed.data.website || null, problemStatement: parsed.data.problem, desiredOutcome: parsed.data.desiredOutcome, urgency: parsed.data.urgency, budgetSignal: parsed.data.budgetSignal, timeline: parsed.data.timeline, technicalEnvironment: parsed.data.technicalEnvironment, securitySensitivity: parsed.data.securitySensitivity, qualificationScore: qualification.score, qualificationStatus: qualification.status as QualificationStatus, nextAction: qualification.nextAction, nextActionAt, consent: parsed.data.consent, notes: parsed.data.constraints, idempotencyKey }, select: { id: true } });
        const assessment = await tx.assessment.create({ data: { leadId: lead.id, problem: parsed.data.problem, workflow: parsed.data.workflow, currentArchitecture: parsed.data.currentArchitecture, constraints: parsed.data.constraints, desiredOutcome: parsed.data.desiredOutcome, urgency: parsed.data.urgency, stakeholders: parsed.data.stakeholders, existingSystems: parsed.data.existingSystems, securityRequirements: parsed.data.securityRequirements, businessImpact: parsed.data.businessImpact, idempotencyKey }, select: { id: true } });
        const opportunity = await tx.opportunity.create({ data: { leadId: lead.id, assessmentId: assessment.id, stage: qualification.status === "QUALIFIED" ? OpportunityStage.QUALIFIED : OpportunityStage.QUALIFYING, currency: "USD", nextAction: qualification.nextAction, nextActionAt, lastActivityAt: new Date() }, select: { id: true } });
        await tx.auditEvent.createMany({ data: [
          { action: "lead.created", resourceType: "lead", resourceId: lead.id, requestId, metadata: { source: parsed.data.source, domain } },
          { action: "assessment.created", resourceType: "assessment", resourceId: assessment.id, requestId, metadata: { qualificationScore: qualification.score, qualificationStatus: qualification.status } },
          { action: "lead.qualified", resourceType: "opportunity", resourceId: opportunity.id, requestId, metadata: { score: qualification.score, status: qualification.status, missing: qualification.missing } },
        ] });
        return { leadId: lead.id, assessmentId: assessment.id, opportunityId: opportunity.id, duplicate: false };
      });
    } catch (error) {
      if (idempotencyKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") { const existing = await db.assessment.findUnique({ where: { idempotencyKey }, select: { id: true, leadId: true, opportunity: { select: { id: true } } } }); if (!existing?.opportunity) throw error; result = { leadId: existing.leadId, assessmentId: existing.id, opportunityId: existing.opportunity.id, duplicate: true }; } else throw error;
    }
    if (!result.duplicate) { try { await recordGrowthEvent({ eventName: "assessment_completed", source: parsed.data.source, path: new URL(request.url).pathname, entityId: result.assessmentId, privacyClass: "PERSONAL", properties: { capability: parsed.data.capability, qualificationStatus: qualification.status } }); } catch (error) { console.error("growth_event_record_failed", { requestId, error }); } }
    return NextResponse.json({ status: "accepted", requestId, ...result, qualification: { score: qualification.score, maxScore: qualification.maxScore, status: qualification.status, why: qualification.why, missing: qualification.missing, nextAction: qualification.nextAction } }, { status: 202, headers: { "cache-control": "no-store", "x-request-id": requestId, "x-ratelimit-remaining": String(limit.remaining) } });
  } catch (error) { console.error("assessment_submission_failed", { requestId, error }); return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
