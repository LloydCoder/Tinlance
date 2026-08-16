# Tinlance Build Phases

Tinlance is built in gated phases. A phase is not considered complete until its implementation, documentation, validation, and CI checks are complete and the pull request is merged.

## Phase 0 — Production Foundation

Completed. Repository, Next.js foundation, CI, baseline security, architecture documentation, and public-project governance established.

## Phase 1 — Design & Content Architecture

Completed. Application structure, content model, service taxonomy, reusable page primitives, and SEO-ready content boundaries established.

## Phase 2 — Security & Platform Foundation

Completed. Security/runtime boundaries, typed environment handling, request correlation, health/readiness endpoints, and security documentation established.

## Phase 3 — Design System & Production UI

Completed. Tinlance visual foundations, responsive layout system, reusable UI primitives, accessibility focus states, and production page styling established.

## Phase 4 — Public Website & Conversion System

Completed. Public information architecture, service discovery, work/proof entry points, contact conversion paths, and crawlable customer journeys established.

## Phase 5 — Content, SEO & Monetization

Completed. Indexable insight detail pages, content sitemap coverage, resource/lead-generation entry points, and commercial conversion boundaries established.

## Phase 6 — Client Portal & Identity

Current phase.

### Scope

- Clerk authentication provider and protected route middleware.
- Sign-in and sign-up entry points.
- Authenticated client portal boundary.
- Organization-aware authorization context.
- Explicit privileged-role enforcement for administration.
- No billing, CRM, or FDE execution coupling before their dedicated phases.
- README and architecture documentation updated for the current phase.

### Exit criteria

- Typecheck passes.
- Lint passes.
- Tests pass.
- Production build passes.
- Authentication boundary is implemented without exposing secrets.
- Portal and admin routes are protected.
- Role authorization is explicit and deny-by-default.
- README reflects the current phase.
- PR is green and merged to `main`.

## Phase 7 — Billing, CRM & Operations

Not started. Begins only after Phase 6 is complete.

## Phase 8 — FDE Mastery Integration

Not started.

## Phase 9 — Enterprise Hardening & Launch

Not started.
