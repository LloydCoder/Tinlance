# Tinlance

> Production-grade AI engineering and Forward Deployed Engineering for enterprise automation, AI infrastructure, security, and intelligent systems.

Tinlance is a production-oriented public engineering platform. The repository is designed to demonstrate disciplined application engineering: typed code, explicit trust boundaries, tenant-aware authorization, persistent data, authenticated service-to-service execution, automated security validation, reproducible deployment, and a separate AI/FDE execution layer.

## Architecture

```text
Client
  │
  ▼
Next.js / Vercel
  ├── Marketing
  ├── Client Portal
  ├── Admin / Operations
  └── API
       │
       ├── Better Auth
       │     ├── Sessions
       │     ├── Organizations
       │     ├── Memberships
       │     └── RBAC
       │
       ├── Security boundary / rate limiting
       ├── PostgreSQL / Prisma / Neon
       ├── Billing / Paystack webhooks
       ├── Audit events / request correlation
       └── FDE API
              │
              ▼
         FastAPI / Python
              ├── authenticated service boundary
              ├── tenant validation
              ├── domain validation
              ├── OAuth 2.0 upstream authentication
              ├── request correlation
              └── health / readiness / telemetry hooks
                       │
                       ▼
                  fde-mastery
                       └── AgentRouter / domain agents
```

## Repository layout

- `apps/web` — Tinlance's Next.js application.
- `apps/web/prisma` — PostgreSQL schema and migrations.
- `apps/fde-api` — authenticated Python FastAPI gateway for FDE execution.
- `packages` — shared contracts, UI, and configuration.
- `content` — case studies, research, insights, services, and industry content.
- `docs` — architecture, security, design, operational documentation, and ADRs.
- `tests` — cross-application end-to-end and integration tests.

## Authentication and authorization

Tinlance uses **Better Auth + Neon PostgreSQL** as its authentication authority and persistent identity store. Clerk is no longer part of the active authentication path.

The authorization model is deliberately layered:

```text
Authentication
      ↓
Session
      ↓
User
      ↓
Organization
      ↓
Membership
      ↓
Role
      ↓
Permission
      ↓
Resource
```

Supported operational roles include Owner, Admin, Security Admin, Billing Admin, Operator, and Viewer. Authorization is enforced server-side; hiding a UI element is never considered an authorization boundary.

See [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md) for the full model and migration notes.

## FDE execution architecture

`apps/fde-api` is the service boundary between Tinlance and the separate `fde-mastery` execution platform.

The execution contract is versioned conceptually as:

```http
POST /v1/{domain}/execute
```

with a tenant-aware payload. Supported domains are:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`

Tinlance authenticates to the FDE API through its internal service boundary. The FDE API separately authenticates upstream to `fde-mastery` using OAuth 2.0 client credentials when configured. Tenant identity, organization context, metadata, and request IDs are propagated explicitly.

See [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md).

## Billing and webhook reliability

Paystack webhooks are treated as an authenticated, replayable event stream rather than a trusted callback.

Controls include:

- request-size limit of 65,536 bytes;
- signature verification before processing;
- JSON and event-shape validation;
- event/reference extraction for idempotency;
- unique `(provider, eventId)` persistence through `WebhookEvent`;
- transactional invoice state transitions;
- audit-event creation;
- correlation/request IDs;
- safe duplicate handling; and
- safe failure responses.

See [`docs/BILLING-WEBHOOKS.md`](./docs/BILLING-WEBHOOKS.md).

## Engineering and security standards

- TypeScript strict mode and Python 3.12 typing.
- Automated linting, type checking, tests, formatting, dependency auditing, security scanning, SBOM validation, container validation, and production builds.
- Secure-by-default HTTP headers including CSP and HSTS.
- Distributed public API rate limiting with Upstash Redis.
- Typed environment boundaries with explicit production secret validation.
- Request correlation IDs across application boundaries.
- PostgreSQL persistence through Prisma with versioned migrations.
- Server-side tenant scoping; client-side filtering is never an authorization boundary.
- Authenticated FastAPI service-to-service execution boundary.
- OAuth 2.0 upstream authentication with cached access tokens and expiry-aware refresh.
- Health and readiness endpoints for deployment/platform checks.
- Dependency and software-supply-chain security as blocking CI controls.
- AI security regression and domain-agent validation in CI.
- Material architecture decisions documented in ADRs.

The security verification baseline is OWASP ASVS 5.0, with stronger controls applied to authentication, authorization, payment/webhook processing, tenant boundaries, and AI execution paths.

## Delivery status

The original website/product build phases are complete. The current platform hardening work has completed the major persistence, authentication, authorization, billing, FDE gateway, supply-chain, and CI improvements described in the architecture documentation.

The current release gate is **enterprise production verification**. A release is not considered complete merely because a build succeeds: production configuration, database migrations, authenticated portal/admin behavior, payment webhooks, and the Tinlance → FDE API → `fde-mastery` execution path must be verified end-to-end.

### Current verified implementation areas

- Better Auth + Neon migration: implemented.
- Clerk authentication path removal: implemented.
- Database-backed sessions, accounts, verification, organizations, memberships, and invitations: implemented.
- Server-side RBAC and tenant-aware authorization: implemented.
- FDE tenant/domain routing: implemented.
- OAuth 2.0 upstream client-credentials flow with token caching: implemented.
- Paystack signature validation, payload limits, idempotency, invoice state handling, and auditing: implemented.
- Prisma `WebhookEvent` persistence and migration: implemented.
- Request correlation across service boundaries: implemented.
- FDE health/readiness checks: implemented.
- Enterprise CI controls including security regression, SBOM, container validation, and dependency auditing: implemented.
- Vercel/pnpm deployment configuration fixes: implemented.

### Production verification still required

These are deployment/runtime acceptance tests, not claims that can be inferred from source code alone:

1. Production Better Auth login/session flows.
2. Authenticated `/portal` end-to-end verification.
3. Authenticated `/admin` end-to-end verification and role enforcement.
4. Production Prisma/Neon transaction and migration verification.
5. Live Paystack signature/idempotency/invoice verification.
6. Live Tinlance → FDE API → `fde-mastery` execution verification.
7. Production failure-path and timeout verification.
8. Final Vercel/FastAPI smoke test and monitoring verification.

## Documentation

- [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md) — Better Auth, sessions, organizations, RBAC, tenant isolation, and migration notes.
- [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md) — FDE API contract, domain routing, OAuth upstream authentication, tenancy, correlation, and readiness.
- [`docs/BILLING-WEBHOOKS.md`](./docs/BILLING-WEBHOOKS.md) — Paystack security, idempotency, invoice state transitions, and audit behavior.
- [`docs/ENTERPRISE-CI-GATES.md`](./docs/ENTERPRISE-CI-GATES.md) — blocking CI/security controls.
- [`docs/SECURITY-RELEASE-GATE.md`](./docs/SECURITY-RELEASE-GATE.md) — release verification requirements.
- [`docs/PHASES.md`](./docs/PHASES.md) — delivery history and current release gate.
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — visual system and UI standards.
- [`docs/decisions/`](./docs/decisions/) — architecture decision records.

## License

No open-source license is currently granted. The repository is public for transparency and engineering credibility; public visibility does not grant permission to reuse proprietary source code.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
