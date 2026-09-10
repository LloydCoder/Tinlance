# M12 — Revenue Intelligence

M12 provides a first-party revenue intelligence layer for the Tinlance commercial funnel.

## Funnel

The analytics contract covers page view → CTA → assessment → lead → booking → qualification → opportunity → proposal → acceptance/won. Existing commercial endpoints emit authoritative lifecycle telemetry for assessment completion, booking completion, proposal creation/acceptance, and CRM opportunity transitions. Public browser page views are collected through a privacy-minimized anonymous identifier.

## Source of truth

- GrowthEvent: behavioral telemetry.
- Lead: persisted acquisition source and qualification state.
- Opportunity: commercial pipeline and deal value.
- Proposal: proposal volume and acceptance state.
- Engagement: contracted delivery value and recurring delivery model.
- Invoice: collected amounts where the existing invoice status is an explicit paid/success/completed state.

Analytics never replaces commercial or accounting truth.

## Attribution

Current attribution is `lead_source`: persisted `Lead.source` is joined to opportunities through `Opportunity.leadId`. Visitor-level first-touch and last-touch attribution are deliberately withheld because the current schema does not provide a reliable anonymous-to-lead identity join. The system must not infer attribution from email, IP address, or probabilistic joins.

## Revenue semantics

Money is stored in minor units. Aggregation never adds different currencies together. When multiple currencies exist in the selected window, the API returns per-currency totals and suppresses a single-currency headline total.

Recurring run-rate is a modeled metric from active/completed `RETAINER` and `FRACTIONAL_FDE` engagements. It assumes `commercialValueMinor` represents the monthly contracted amount for those delivery models. It is not an accounting statement.

ARR run-rate is recurring run-rate × 12 and follows the same modeling caveat.

## Security

The ingestion endpoint is rate limited, size limited, origin checked when an Origin header is present, schema validated, and stores no browser PII. The dashboard and API require the existing privileged server-side authorization boundary. Admin telemetry is never exposed to public clients.

## Operational surfaces

- `POST /api/v1/analytics/events` — governed first-party event ingestion.
- `GET /api/v1/admin/revenue-intelligence` — privileged analytics API; supports `days` (1–365) and explicit `from`/`to` ISO dates.
- `/admin/revenue` — privileged revenue intelligence dashboard.

## Primary business metric

**Revenue per qualified visitor**. The implementation only calculates this when a single currency is present; otherwise it returns `null` rather than producing a mathematically invalid cross-currency number.

## Deployment verification

The first Vercel preview for this branch returned a platform-side `BUILD_FAILED / Resource provisioning failed` state without build-error events. This was treated as infrastructure/transient deployment state rather than a code failure. The next branch revision is intentionally used to force a fresh Vercel deployment; CI remains the authoritative source for source/test/build validation.
