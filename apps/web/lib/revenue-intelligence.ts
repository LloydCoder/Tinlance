import "server-only";

import { db } from "@/lib/db";

export const FUNNEL_EVENT_NAMES = [
  "page_view", "cta_view", "cta_click", "assessment_started", "assessment_completed",
  "lead_form_started", "lead_captured", "booking_started", "booking_completed",
  "lead_qualified", "opportunity_created", "proposal_created", "proposal_accepted", "deal_won",
] as const;

const QUALIFIED_VISITOR_EVENTS = [
  "lead_qualified", "assessment_completed", "booking_completed", "opportunity_created",
  "proposal_created", "proposal_accepted", "deal_won",
] as const;

function dateRange(input: { from?: string; to?: string; days?: number }) {
  const now = new Date();
  const to = input.to ? new Date(input.to) : now;
  const days = Math.min(Math.max(Number(input.days ?? 90), 1), 365);
  const from = input.from ? new Date(input.from) : new Date(to.getTime() - days * 86_400_000);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) throw new Error("invalid_date_range");
  return { from, to };
}

export async function getRevenueIntelligence(input: { from?: string; to?: string; days?: number } = {}) {
  const { from, to } = dateRange(input);
  const where = { occurredAt: { gte: from, lte: to } };
  const [events, qualifiedVisitors, leads, opportunities, proposals, engagements, invoices] = await Promise.all([
    db.growthEvent.groupBy({ where, by: ["eventName"], _count: { _all: true } }),
    db.growthEvent.findMany({ where: { ...where, eventName: { in: [...QUALIFIED_VISITOR_EVENTS] }, anonymousId: { not: null } }, select: { anonymousId: true }, distinct: ["anonymousId"] }),
    db.lead.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, source: true, campaign: true, qualificationStatus: true, createdAt: true } }),
    db.opportunity.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, leadId: true, stage: true, valueMinor: true, currency: true, createdAt: true } }),
    db.proposal.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, leadId: true, status: true, createdAt: true, acceptedAt: true } }),
    db.engagement.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, commercialValueMinor: true, currency: true, deliveryModel: true, status: true, createdAt: true } }),
    db.invoice.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { amountMinor: true, currency: true, status: true, createdAt: true } }),
  ]);

  const funnel: Record<string, number> = Object.fromEntries(FUNNEL_EVENT_NAMES.map((name) => [name, 0]));
  for (const row of events) funnel[row.eventName] = row._count._all;
  const qualifiedLeadCount = leads.filter((lead) => lead.qualificationStatus === "QUALIFIED").length;
  const wonOpportunities = opportunities.filter((o) => o.stage === "ACCEPTED" || o.stage === "ACTIVE" || o.stage === "COMPLETED");
  const acceptedProposals = proposals.filter((p) => p.status === "ACCEPTED").length;
  const contracted = engagements.filter((e) => e.status === "ACTIVE" || e.status === "COMPLETED");
  const contractedRevenue = contracted.reduce((sum, e) => sum + (e.commercialValueMinor ?? 0), 0);
  const recurring = contracted.filter((e) => e.deliveryModel === "RETAINER" || e.deliveryModel === "FRACTIONAL_FDE");
  const recurringRunRate = recurring.reduce((sum, e) => sum + (e.commercialValueMinor ?? 0), 0);
  const paidStatuses = new Set(["paid", "success", "successful", "completed"]);
  const collected = invoices.filter((i) => paidStatuses.has(i.status.toLowerCase())).reduce((sum, i) => sum + i.amountMinor, 0);

  const channelMap = new Map<string, { leads: number; qualifiedLeads: number; wonDeals: number; contractedRevenueMinor: number }>();
  for (const lead of leads) {
    const channel = lead.source || "unknown";
    const current = channelMap.get(channel) ?? { leads: 0, qualifiedLeads: 0, wonDeals: 0, contractedRevenueMinor: 0 };
    current.leads += 1;
    if (lead.qualificationStatus === "QUALIFIED") current.qualifiedLeads += 1;
    const leadWon = wonOpportunities.filter((o) => o.leadId === lead.id);
    current.wonDeals += leadWon.length;
    current.contractedRevenueMinor += leadWon.reduce((sum, o) => sum + (o.valueMinor ?? 0), 0);
    channelMap.set(channel, current);
  }

  const winRate = leads.length ? wonOpportunities.length / leads.length : 0;
  const revenuePerQualifiedVisitor = qualifiedVisitors.length ? contractedRevenue / qualifiedVisitors.length : 0;

  return {
    range: { from: from.toISOString(), to: to.toISOString() },
    funnel,
    commercial: {
      leads: leads.length, qualifiedLeads: qualifiedLeadCount, meetings: funnel.booking_completed,
      proposals: proposals.length, acceptedProposals, wonDeals: wonOpportunities.length, winRate,
      contractedRevenueMinor: contractedRevenue, collectedRevenueMinor: collected,
      recurringRunRateMinor: recurringRunRate, modeledArrRunRateMinor: recurringRunRate * 12,
      revenuePerQualifiedVisitorMinor: revenuePerQualifiedVisitor,
      currencies: Array.from(new Set([...opportunities.map((o) => o.currency), ...engagements.map((e) => e.currency), ...invoices.map((i) => i.currency)].filter(Boolean))),
    },
    visitors: { qualified: qualifiedVisitors.length },
    channels: Array.from(channelMap, ([channel, values]) => ({ channel, ...values })).sort((a, b) => b.contractedRevenueMinor - a.contractedRevenueMinor),
    attribution: {
      model: "lead_source",
      firstTouch: "not_reliably_available_from_current_identity_joins",
      lastTouch: "not_reliably_available_from_current_identity_joins",
      note: "Revenue is attributed to persisted Lead.source and Opportunity.leadId. Visitor-level first/last touch is not inferred without an explicit identity join.",
    },
  };
}
