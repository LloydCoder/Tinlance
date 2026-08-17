# Tinlance Delivery Phases

Tinlance uses gated delivery. A phase is complete only when implementation, documentation, validation, and the required CI checks are complete and the resulting change is merged.

## Phase 0 — Production Foundation

**Complete.** Repository governance, Next.js foundation, CI, baseline security, architecture documentation, and public-project standards established.

## Phase 1 — Design & Content Architecture

**Complete.** Application structure, content model, service taxonomy, reusable page primitives, and SEO-ready content boundaries established.

## Phase 2 — Security & Platform Foundation

**Complete.** Runtime boundaries, typed environment handling, request correlation, health/readiness endpoints, and security documentation established.

## Phase 3 — Design System & Production UI

**Complete.** Visual foundations, responsive layout system, reusable UI primitives, accessibility focus states, and production page styling established.

## Phase 4 — Public Website & Conversion System

**Complete.** Public information architecture, service discovery, proof/work entry points, contact conversion paths, and crawlable customer journeys established.

## Phase 5 — Content, SEO & Monetization

**Complete.** Indexable insight detail pages, content sitemap coverage, resource/lead-generation entry points, and commercial conversion boundaries established.

## Phase 6 — Client Portal & Identity

**Complete.** The portal and identity boundary were established and subsequently migrated from Clerk to Better Auth + Neon. The current identity architecture is documented in [`AUTHENTICATION.md`](./AUTHENTICATION.md).

## Phase 7 — Billing, CRM & Operations

**Complete.** Lead/booking persistence, Paystack webhook authentication and idempotency, invoice state handling, audit events, request correlation, and operational data boundaries were implemented.

## Phase 8 — FDE Mastery Integration

**Complete at the implementation boundary.** `apps/fde-api` provides the authenticated FastAPI gateway, tenant/domain validation, upstream OAuth 2.0 authentication, request propagation, health/readiness checks, and automated tests. External production execution remains a deployment acceptance test and must not be inferred solely from source presence.

## Phase 9 — Enterprise Hardening & Production Verification

**Current release gate.** The remaining work is production verification and evidence collection rather than another frontend rebuild.

### Scope

- Better Auth production authentication/session verification.
- Organization and role enforcement in real deployment conditions.
- Tenant-isolation E2E verification.
- Production Neon/Prisma migration and transaction verification.
- Live Paystack webhook verification, including duplicate delivery behavior.
- Live Tinlance → FDE API → `fde-mastery` execution verification.
- Upstream timeout, retry, authentication-failure, and degraded-service behavior.
- Vercel/FastAPI deployment verification.
- Monitoring, logging, and correlation verification.
- Final security and supply-chain gate.

### Exit criteria

- CI is green on the exact release commit.
- Typecheck, lint, tests, formatting, security scans, SBOM, container validation, and production builds pass.
- Better Auth production flows pass.
- Portal/admin authorization and tenant isolation pass E2E.
- Production database transactions and migrations pass verification.
- Paystack webhook authentication and idempotency pass live verification.
- FDE upstream execution passes an authenticated end-to-end test.
- Failure paths are safe and observable.
- README and operational documentation match the verified implementation.
- Release is merged only after all required checks are green.
