import { z } from "zod";

export const leadStatusSchema = z.enum([
  "new",
  "qualified",
  "assessment",
  "proposal",
  "won",
  "lost",
]);

export const leadSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  country: z.string().trim().min(2).max(80),
  service: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(4000).optional(),
  status: leadStatusSchema.default("new"),
});

const text = (max: number) => z.string().trim().min(2).max(max);

export const assessmentSchema = z.object({
  organizationName: text(160),
  contactName: text(120),
  email: z.string().email().max(254),
  country: text(80),
  roleTitle: z.string().trim().max(120).optional(),
  companySize: z.string().trim().max(80).optional(),
  website: z.string().url().max(300).optional().or(z.literal("")),
  capability: text(120),
  problem: text(4000),
  workflow: z.string().trim().max(4000).optional(),
  currentArchitecture: z.string().trim().max(4000).optional(),
  constraints: z.string().trim().max(4000).optional(),
  desiredOutcome: text(3000),
  urgency: z.enum(["exploring", "30_days", "90_days", "urgent"]).default("exploring"),
  stakeholders: z.string().trim().max(2000).optional(),
  existingSystems: z.string().trim().max(3000).optional(),
  securityRequirements: z.string().trim().max(3000).optional(),
  businessImpact: z.string().trim().max(3000).optional(),
  budgetSignal: z.enum(["unknown", "under_5k", "5k_25k", "25k_100k", "100k_plus"]).default("unknown"),
  timeline: z.string().trim().max(120).optional(),
  technicalEnvironment: z.string().trim().max(3000).optional(),
  securitySensitivity: z.enum(["standard", "sensitive", "regulated", "critical"]).default("standard"),
  source: z.string().trim().max(120).default("website"),
  campaign: z.string().trim().max(160).optional(),
  referral: z.string().trim().max(160).optional(),
  consent: z.boolean().default(false),
});

export const assessmentBookingSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  startsAt: z.string().datetime({ offset: true }),
  timezone: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(4000).optional(),
  leadId: z.string().cuid().optional(),
  assessmentId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
});

export const opportunityTransitionSchema = z.object({
  opportunityId: z.string().cuid(),
  to: z.enum([
    "NEW", "ASSESSMENT_REQUESTED", "QUALIFYING", "QUALIFIED", "DISQUALIFIED",
    "BOOKING_PENDING", "BOOKED", "ASSESSMENT_COMPLETE", "PROPOSAL_DRAFT",
    "PROPOSAL_SENT", "PROPOSAL_VIEWED", "NEGOTIATING", "ACCEPTED", "DECLINED",
    "ENGAGEMENT_PENDING", "ACTIVE", "COMPLETED",
  ]),
  reason: z.string().trim().max(1000).optional(),
  nextAction: z.string().trim().max(300).optional(),
  nextActionAt: z.string().datetime({ offset: true }).optional(),
});

const jsonList = z.array(z.string().trim().min(1).max(1000)).max(100);

export const proposalVersionSchema = z.object({
  executiveSummary: text(8000),
  problemDefinition: text(8000),
  proposedSolution: text(12000),
  scope: jsonList,
  deliverables: jsonList,
  assumptions: jsonList,
  exclusions: jsonList,
  timeline: jsonList,
  milestones: jsonList,
  pricing: z.object({ currency: z.string().length(3), totalMinor: z.number().int().nonnegative(), items: z.array(z.object({ name: text(160), amountMinor: z.number().int().nonnegative() })).max(100) }),
  paymentSchedule: jsonList,
  dependencies: jsonList,
  securityConsiderations: z.string().trim().max(8000).optional(),
  acceptanceTerms: text(8000),
});

export const proposalCreateSchema = z.object({
  leadId: z.string().cuid(),
  assessmentId: z.string().cuid().optional(),
  opportunityId: z.string().cuid().optional(),
  title: text(240),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  version: proposalVersionSchema,
});

export const proposalSendSchema = z.object({ proposalId: z.string().cuid() });
export const proposalAcceptSchema = z.object({
  token: z.string().min(32).max(128),
  acceptedByName: text(120),
  acceptedByEmail: z.string().email().max(254),
  accept: z.literal(true),
});

export const engagementCreateSchema = z.object({
  proposalId: z.string().cuid(),
  deliveryModel: z.enum(["PROJECT", "FDE_SPRINT", "FRACTIONAL_FDE", "RETAINER"]),
  startDate: z.string().datetime({ offset: true }).optional(),
  expectedEndDate: z.string().datetime({ offset: true }).optional(),
  ownerUserId: z.string().cuid().optional(),
  billingRelationship: z.string().trim().max(500).optional(),
  securityRequirements: z.string().trim().max(3000).optional(),
});

export const invoiceSchema = z.object({
  organizationId: z.string().trim().min(1).max(128),
  currency: z.enum(["NGN", "USD", "EUR", "GBP"]),
  amountMinor: z.number().int().positive(),
  description: z.string().trim().min(2).max(500),
});

export type Lead = z.infer<typeof leadSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type AssessmentBooking = z.infer<typeof assessmentBookingSchema>;
export type ProposalVersionInput = z.infer<typeof proposalVersionSchema>;
