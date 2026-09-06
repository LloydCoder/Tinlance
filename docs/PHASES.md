# Tinlance Delivery Phases

Tinlance uses gated delivery. A phase is complete only when implementation, documentation, validation, required CI checks and the resulting merge evidence are complete.

## Foundation and public platform history

The original Phase 0–9 implementation sequence established the public website, conversion system, identity, billing/operations, FDE boundary and enterprise hardening. Those historical phase records remain useful for provenance but are no longer the current phase ledger.

## M0 — Legacy Site Discovery and Migration

**Complete.** Legacy Tinlance routes were inventoried and classified, direct permanent redirects were implemented, canonical SEO signals were preserved, historical ThreatFade evidence was reconciled, and the migration certificate was merged. DNS cutover was explicitly excluded.

Certificate: [`docs/migrations/LEGACY_SITE_MIGRATION_CERTIFICATE.md`](./migrations/LEGACY_SITE_MIGRATION_CERTIFICATE.md).

## M1 — Commercial Engine

**Complete.** The current commercial data model and workflow support assessment, qualification, booking, opportunities, proposals, acceptance and client onboarding without replacing the existing authentication, tenancy, billing or FDE boundaries.

## M2 — Authority Engine

**Current implementation phase.** M2 covers public authority rather than M1 commercial automation or future product layers.

### Scope

- technical SEO and canonical discovery;
- AI/search crawler policy and machine-readable entity clarity;
- research model and evidence provenance;
- case-study model with evidence gating;
- insights/guides/documentation authority routes;
- internal linking and assessment CTAs;
- content freshness and review metadata;
- documentation reconciliation and current architecture truth;
- authority validation tests.

### Implemented in the M2 branch

- canonical authority content model;
- research index and evidence-scoped ThreatFade research;
- reusable case-study schema without fabricated customer outcomes;
- guide and public documentation hubs;
- Organization/WebSite/Breadcrumb/Article JSON-LD;
- explicit Google/Bing/OpenAI crawler policy;
- canonical sitemap expansion;
- optional generated `/llms.txt` orientation aid;
- article provenance and freshness fields;
- authority governance and research policy documentation;
- canonical current architecture documentation;
- documentation reconciliation of the stale FDE route/domain description and README phase ledger.

### Exit criteria

- M2 implementation tests green.
- Existing enterprise CI/security gates remain blocking and green.
- Main branch contains the merged M2 implementation.
- Production deployment for the M2 commit is successful.
- Representative public authority routes, robots, sitemap, metadata, structured data and assessment CTAs are verified in production.
- M0 redirects remain green.
- No material documentation contradiction remains in the audited current docs.

## Post-M2 boundaries

The following remain future phases and are not silently included in M2:

- MCP implementation;
- AI sales agent;
- autonomous content publishing;
- customer knowledge/RAG system;
- AI Security Gateway/control plane;
- full revenue intelligence platform.
