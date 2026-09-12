import { Prisma, OpportunityStage, QualificationStatus } from "@prisma/client";
import { assessmentSchema, type Assessment } from "@/lib/operations/contracts";
import { qualifyAssessment } from "@/lib/commercial/qualification";
import { db } from "@/lib/db";
import { recordGrowthEvent } from "@/lib/growth/events";

export type AssessmentIntakeResult = {
  leadId: string;
  assessmentId: string;
  opportunityId: string;
  duplicate: boolean;
  qualification: ReturnType<typeof qualifyAssessment>;
};

function domainFromWebsite(website?: string) {
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function processAssessmentIntake(input: Assessment, requestId: string, idempotencyKey: string): Promise<AssessmentIntakeResult> {
  const qualification = qualifyAssessment({
    problem: input.problem,
    workflow: input.workflow ?? null,
    currentArchitecture: input.currentArchitecture ?? null,
    constraints: input.constraints ?? null,
    desiredOutcome: input.desiredOutcome,
    urgency: input.urgency ?? null,
    stakeholders: input.stakeholders ?? null,
    existingSystems: input.existingSystems ?? null,
    securityRequirements: input.securityRequirements ?? null,
    businessImpact: input.businessImpact ?? null,
    budgetSignal: input.budgetSignal ?? null,
    companySize: input.companySize ?? null,
    roleTitle: input.roleTitle ?? null,
    technicalEnvironment: input.technicalEnvironment ?? null,
    securitySensitivity: input.securitySensitivity ?? null,
  });

  const domain = domainFromWebsite(input.website);
  const nextActionAt = new Date(Date.now() + (qualification.status === "QUALIFIED" ? 24 : 72) * 60 * 60 * 1000);

  let result: { leadId: string; assessmentId: string; opportunityId: string; duplicate: boolean };
  try {
    result = await db.$transaction(async (tx) => {
      const existing = await tx.assessment.findUnique({
        where: { idempotencyKey },
        select: { id: true, leadId: true, opportunity: { select: { id: true } } },
      });
      if (existing?.opportunity) {
        return { leadId: existing.leadId, assessmentId: existing.id, opportunityId: existing.opportunity.id, duplicate: true };
      }

      const lead = await tx.lead.create({
        data: {
          organizationName: input.organizationName,
          contactName: input.contactName,
          email: input.email,
          country: input.country,
          service: input.capability,
          source: "website",
          campaign: input.campaign,
          referral: input.referral,
          roleTitle: input.roleTitle,
          companySize: input.companySize,
          website: input.website || null,
          problemStatement: input.problem,
          desiredOutcome: input.desiredOutcome,
          urgency: input.urgency,
          budgetSignal: input.budgetSignal,
          timeline: input.timeline,
          technicalEnvironment: input.technicalEnvironment,
          securitySensitivity: input.securitySensitivity,
          qualificationScore: qualification.score,
          qualificationStatus: qualification.status as QualificationStatus,
          nextAction: qualification.nextAction,
          nextActionAt,
          consent: input.consent,
          notes: input.constraints,
          idempotencyKey,
        },
        select: { id: true },
      });

      const assessment = await tx.assessment.create({
        data: {
          leadId: lead.id,
          problem: input.problem,
          workflow: input.workflow,
          currentArchitecture: input.currentArchitecture,
          constraints: input.constraints,
          desiredOutcome: input.desiredOutcome,
          urgency: input.urgency,
          stakeholders: input.stakeholders,
          existingSystems: input.existingSystems,
          securityRequirements: input.securityRequirements,
          businessImpact: input.businessImpact,
          idempotencyKey,
        },
        select: { id: true },
      });

      const opportunity = await tx.opportunity.create({
        data: {
          leadId: lead.id,
          assessmentId: assessment.id,
          stage: qualification.status === "QUALIFIED" ? OpportunityStage.QUALIFIED : OpportunityStage.QUALIFYING,
          currency: "USD",
          nextAction: qualification.nextAction,
          nextActionAt,
          lastActivityAt: new Date(),
        },
        select: { id: true },
      });

      await tx.auditEvent.createMany({
        data: [
          { action: "lead.created", resourceType: "lead", resourceId: lead.id, requestId, metadata: { source: "website", domain } },
          { action: "assessment.created", resourceType: "assessment", resourceId: assessment.id, requestId, metadata: { qualificationStatus: qualification.status } },
          { action: "lead.qualified", resourceType: "opportunity", resourceId: opportunity.id, requestId, metadata: { status: qualification.status, missing: qualification.missing } },
        ],
      });

      return { leadId: lead.id, assessmentId: assessment.id, opportunityId: opportunity.id, duplicate: false };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await db.assessment.findUnique({ where: { idempotencyKey }, select: { id: true, leadId: true, opportunity: { select: { id: true } } } });
      if (existing?.opportunity) {
        result = { leadId: existing.leadId, assessmentId: existing.id, opportunityId: existing.opportunity.id, duplicate: true };
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  if (!result.duplicate) {
    await Promise.allSettled([
      recordGrowthEvent({ eventName: "assessment_completed", source: "website", path: "/assessment", entityId: result.assessmentId, privacyClass: "INTERNAL", properties: { qualificationStatus: qualification.status } }),
      qualification.status === "QUALIFIED"
        ? recordGrowthEvent({ eventName: "lead_qualified", source: "website", path: "/assessment", entityId: result.leadId, privacyClass: "INTERNAL", properties: { outcome: "qualified" } })
        : Promise.resolve(),
      recordGrowthEvent({ eventName: "opportunity_created", source: "website", path: "/assessment", entityId: result.opportunityId, privacyClass: "INTERNAL", properties: { stage: qualification.status === "QUALIFIED" ? "QUALIFIED" : "QUALIFYING" } }),
    ]);
  }

  return { ...result, qualification };
}

export function parseAssessmentInput(raw: unknown) {
  return assessmentSchema.safeParse(raw);
}
