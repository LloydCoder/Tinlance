# Sprint C — Assessment Conversion

The public `/assessment` flow is a progressive commercial intake, not a second CRM.

## Flow

`Assessment → validation → abuse controls → M1 intake → Lead + Assessment + Qualification → Opportunity → booking/proposal path`

The browser submits facts only. Qualification, persistence, lifecycle state, audit records, and commercial routing remain server-authoritative.

## Assessment UX

The current public assessment uses four stages:

1. **Objective** — capability, problem, desired outcome.
2. **Technical context** — workflow, architecture/process, integrations, technical environment, constraints, and security context.
3. **Business context** — organization, contact, work email, country, role, company size, website, timeline, urgency, budget signal, stakeholders, and business impact.
4. **Review** — concise summary before submission.

Back navigation preserves state. Next validates the current stage and focuses the first invalid field. Submission disables duplicate interaction and preserves state on recoverable failure.

## Validation

`apps/web/lib/operations/contracts.ts` contains the authoritative Zod contract used by the public assessment API. It:

- normalizes bounded text and email casing;
- bounds free-text and URL lengths;
- restricts enumerations;
- requires explicit consent;
- requires the server-controlled `website` source value;
- rejects unknown fields.

Client validation exists for immediate field feedback. Server validation is authoritative.

## Submission hardening

The public assessment endpoint applies:

- JSON content-type enforcement;
- a 24 KiB request-body limit before database/qualification processing;
- an unguessable idempotency-key requirement;
- IP + route rate limiting using the existing rate-limit implementation;
- honeypot rejection without commercial persistence;
- safe JSON parsing and bounded schema validation;
- correlation via `x-request-id`;
- safe error classes with no database/stack/implementation details;
- atomic Lead, Assessment, Opportunity, and AuditEvent persistence in one Prisma transaction;
- deterministic replay handling through the database idempotency constraints.

Invalid input is logged only with correlation metadata and field count; assessment free text is not dumped into logs.

## M1 qualification

`apps/web/lib/commercial/assessment-intake.ts` is the server-side intake boundary. It reuses the existing `qualifyAssessment` implementation and persists the resulting qualification state to the existing Lead and Opportunity models.

A successful first submission creates one Lead, one Assessment, one Opportunity, and the corresponding audit records atomically. A retry with the same idempotency key returns the existing commercial result rather than creating another set of records. A new idempotency key remains capable of representing a legitimate new assessment for the same organization.

No qualification score, internal reasons, CRM identifiers, owner information, or internal routing data is returned to the unauthenticated browser.

## Booking handoff

After a qualified result, the public UI can request an available technical discovery time. The booking endpoint resolves the assessment server-side from the opaque assessment idempotency reference and verifies the submitted email against the persisted Lead. Database identifiers are not sent to the browser.

Booking persistence and the opportunity transition to `BOOKED` occur in one transaction.

## Analytics

The public UI records only non-sensitive funnel metadata through the existing analytics endpoint, including assessment start/progression, result view, and booking CTA interaction. Raw email, phone, free-text problem statements, architecture details, and security descriptions are not sent as analytics properties.

Server-side commercial events use the existing growth-event architecture after persistence.

## Testing boundary

The repository does not currently contain a Playwright/browser test harness for `/assessment`. Sprint C therefore keeps the automated browser boundary explicit rather than claiming an E2E suite that does not exist. The implemented validation and M1 persistence paths are covered by the repository's existing CI typecheck/lint/test/build/security gates plus focused contract tests for valid, malformed, unknown-field, bounded-input, and consent cases.

## Security boundary

The public result intentionally reveals only a safe next-step message. Qualification scores, internal reasons, missing-signal analysis, CRM identifiers, sales ownership, and routing details remain internal.
