import { z } from "zod";

export const growthEventNames = [
  "page_view", "content_view", "resource_view", "service_view", "proof_view", "github_referral", "external_referral",
  "content_engagement", "cta_view", "cta_click", "service_interaction", "resource_download", "assessment_viewed",
  "assessment_started", "assessment_progressed", "assessment_completed", "assessment_result_viewed", "assessment_cta_clicked",
  "lead_form_started", "lead_captured", "booking_started", "booking_completed", "lead_qualified", "opportunity_created",
  "proposal_created", "proposal_accepted", "deal_won", "deal_lost", "project_started", "project_milestone_reached",
  "customer_activated", "customer_outcome_recorded", "customer_expanded", "customer_churned", "advocacy_requested",
  "testimonial_received", "referral_received", "case_study_authorized", "product_viewed", "product_activation_started",
  "product_activated", "product_repeat_usage", "oss_documentation_viewed", "oss_install_intent", "oss_commercial_intent",
  "experiment_exposed", "experiment_converted",
] as const;

export const privacyClasses = [
  "PUBLIC", "INTERNAL", "PERSONAL", "CUSTOMER", "SENSITIVE", "FINANCIAL", "SECURITY_SENSITIVE",
] as const;

export const growthEventSchema = z.object({
  eventName: z.enum(growthEventNames),
  schemaVersion: z.number().int().positive().default(1),
  occurredAt: z.coerce.date().optional(),
  anonymousId: z.string().max(128).optional(),
  userId: z.string().max(128).optional(),
  organizationId: z.string().max(128).optional(),
  source: z.string().trim().min(1).max(128),
  path: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  campaign: z.record(z.string(), z.string().max(256)).optional(),
  entityId: z.string().max(128).optional(),
  privacyClass: z.enum(privacyClasses),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type GrowthEventInput = z.input<typeof growthEventSchema>;
