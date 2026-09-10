import "server-only";

import { db } from "@/lib/db";

export const FUNNEL_EVENT_NAMES = ["page_view", "cta_view", "cta_click", "assessment_started", "assessment_completed", "lead_form_started", "lead_captured", "booking_started", "booking_completed", "lead_qualified", "opportunity_created", "proposal_created", "proposal_accepted", "deal_won"] as const;
const QUALIFIED_VISITOR_EVENTS = ["lead_qualified", "assessment_completed", "booking_completed", "opportunity_created", "proposal_created", "proposal_accepted", "deal_won"] as const;

function dateRange(input: { from?: string; to?: string; days?: number }) {
  const to = input.to ? new Date(input.to) : new Date();
  const days = Math.min(Math.max(Number(input.days ?? 90), 1), 365);
  const from = input.from ? new Date(input.from) : new Date(to.getTime() - days * 86_400_000);
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) throw new Error("invalid_date_range");
  return { from, to };
}

export async function getRevenueIntelligence(input: { from?: string; to?: string; days?: number } = {}) {
  const { from, to } = dateRange(input);
  const growthWhere = { occurredAt: { gte: from, lte: to } };
  const [events, qualifiedVisitors, leads, opportunities, proposals, engagements, invoices] = await Promise.all([
    db.growthEvent.groupBy({ where: growthWhere, by: ["eventName"], _count: { _all: true } }),
    db.growthEvent.findMany({ where: { ...growthWhere, eventName: { in: [...QUALIFIED_VISITOR_EVENTS] }, anonymousId: { not: null } }, select: { anonymousId: true }, distinct: ["anonymousId"] }),
    db.lead.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, source: true, qualificationStatus: true } }),
    db.opportunity.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { id: true, leadId: true, stage: true, valueMinor: true, currency: true } }),
    db.proposal.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { status: true } }),
    db.engagement.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { commercialValueMinor: true, currency: true, deliveryModel: true, status: true } }),
    db.invoice.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { amountMinor: true, currency: true, status: true } }),
  ]);
  const funnel: Record<string, number> = Object.fromEntries(FUNNEL_EVENT_NAMES.map((name) => [name, 0]));
  for (const row of events) funnel[row.eventName] = row._count._all;
  const wonOpportunities = opportunities.filter((o) => o.stage === "ACCEPTED" || o.stage === "ACTIVE" || o.stage === "COMPLETED");
  const acceptedProposals = proposals.filter((p) => p.status === "ACCEPTED").length;
  const contracted = engagements.filter((e) => e.status === "ACTIVE" || e.status === "COMPLETED");
  const recurring = contracted.filter((e) => e.deliveryModel === "RETAINER" || e.deliveryModel === "FRACTIONAL_FDE");
  const paidStatuses = new Set(["paid", "success", "successful", "completed"]);
  const currencies = Array.from(new Set([...opportunities.map((o) => o.currency), ...engagements.map((e) => e.currency), ...invoices.map((i) => i.currency)].filter((v): v is string => Boolean(v))));
  const revenueByCurrency = new Map<string, { contracted: number; collected: number; recurring: number }>();
  for (const currency of currencies) revenueByCurrency.set(currency, { contracted: 0, collected: 0, recurring: 0 });
  for (const engagement of contracted) { const bucket = revenueByCurrency.get(engagement.currency); if (bucket) bucket.contracted += engagement.commercialValueMinor ?? 0; }
  for (const engagement of recurring) { const bucket = revenueByCurrency.get(engagement.currency); if (bucket) bucket.recurring += engagement.commercialValueMinor ?? 0; }
  for (const invoice of invoices) if (paidStatuses.has(invoice.status.toLowerCase())) { const bucket = revenueByCurrency.get(invoice.currency) ?? { contracted: 0, collected: 0, recurring: 0 }; bucket.collected += invoice.amountMinor; revenueByCurrency.set(invoice.currency, bucket); }
  const wonByLead = new Map<string, { count: number; revenue: number }>();
  for (const opportunity of wonOpportunities) { const current = wonByLead.get(opportunity.leadId) ?? { count: 0, revenue: 0 }; current.count += 1; current.revenue += opportunity.valueMinor ?? 0; wonByLead.set(opportunity.leadId, current); }
  const channelMap = new Map<string, { leads: number; qualifiedLeads: number; wonDeals: number; attributedWonValueMinor: number }>();
  for (const lead of leads) { const channel = lead.source || "unknown"; const current = channelMap.get(channel) ?? { leads: 0, qualifiedLeads: 0, wonDeals: 0, attributedWonValueMinor: 0 }; current.leads += 1; if (lead.qualificationStatus === "QUALIFIED") current.qualifiedLeads += 1; const won = wonByLead.get(lead.id); if (won) { current.wonDeals += won.count; current.attributedWonValueMinor += won.revenue; } channelMap.set(channel, current); }
  const onlyCurrency = currencies.length === 1 ? currencies[0] : null;
  const revenue = onlyCurrency ? revenueByCurrency.get(onlyCurrency) ?? { contracted: 0, collected: 0, recurring: 0 } : null;
  return {
    range: { from: from.toISOString(), to: to.toISOString() }, funnel, visitors: { qualified: qualifiedVisitors.length },
    commercial: {
      leads: leads.length, qualifiedLeads: leads.filter((l) => l.qualificationStatus === "QUALIFIED").length, meetings: funnel.booking_completed,
      proposals: proposals.length, acceptedProposals, wonDeals: wonOpportunities.length, winRate: leads.length ? wonOpportunities.length / leads.length : 0,
      currency: onlyCurrency, contractedRevenueMinor: revenue?.contracted ?? null, collectedRevenueMinor: revenue?.collected ?? null,
      recurringRunRateMinor: revenue?.recurring ?? null, modeledArrRunRateMinor: revenue ? revenue.recurring * 12 : null,
      revenuePerQualifiedVisitorMinor: revenue && qualifiedVisitors.length ? revenue.contracted / qualifiedVisitors.length : null,
      revenueByCurrency: Object.fromEntries(Array.from(revenueByCurrency, ([currency, values]) => [currency, values])),
    },
    channels: Array.from(channelMap, ([channel, values]) => ({ channel, ...values })).sort((a, b) => b.attributedWonValueMinor - a.attributedWonValueMinor),
    attribution: { model: "lead_source", firstTouch: "not_reliably_available_from_current_identity_joins", lastTouch: "not_reliably_available_from_current_identity_joins", note: "Revenue is attributed to persisted Lead.source and Opportunity.leadId. Visitor-level first/last touch is not inferred without an explicit identity join." },
  };
}
