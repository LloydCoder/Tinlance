# Tinlance

> Production-oriented AI engineering and Forward Deployed Engineering for enterprise automation, AI infrastructure, security, and intelligent systems.

Tinlance is being developed as a production-oriented engineering platform with explicit trust boundaries, tenant-aware authorization, persistent data, authenticated service-to-service execution, automated security validation, reproducible builds, and a separate AI/FDE execution layer.

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
       ├── Better Auth 1.7.x
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
         FastAPI / Python 3.12
              ├── authenticated service boundary
              ├── trusted-host policy
              ├── tenant/domain context propagation
              ├── OAuth 2.0 upstream authentication
              └── request correlation
                       │
                       ▼
                  fde-mastery
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

Tinlance uses **Better Auth + Neon PostgreSQL** as its authentication authority and persistent identity store. Clerk is not part of the active authentication path.

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

The application uses a user-level privileged role boundary for administrative access and Better Auth organization membership roles for tenant membership. Authorization is enforced server-side; hiding a UI element is never considered an authorization boundary.

See [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md).

## FDE execution architecture

`apps/fde-api` is the service boundary between Tinlance and the separate `fde-mastery` execution platform.

Current gateway contract:

```http
POST /v1/execute
```

Supported domains are:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`

The Tinlance application authenticates the user and must establish organization membership before invoking the gateway. The FDE API separately authenticates upstream to `fde-mastery` using OAuth 2.0 client credentials when configured. Organization context, metadata, and validated request IDs are propagated explicitly.

See [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md) and [`apps/fde-api/README.md`](./apps/fde-api/README.md).

## Billing and webhook reliability

Paystack webhooks are treated as authenticated, replayable events rather than trusted callbacks.

Controls include:

- request-size limit of 65,536 bytes;
- HMAC SHA-512 signature verification before processing;
- JSON and event-shape validation;
- provider event identity persistence through `WebhookEvent`;
- duplicate-event handling;
- invoice amount/currency matching before state changes;
- monotonic invoice state-transition rules;
- transactional invoice updates and audit events; and
- request correlation with safe failure responses.

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
- Trusted-host enforcement for the FDE API.
- Health and readiness endpoints for deployment/platform checks.
- Dependency and software-supply-chain security as blocking CI controls.
- AI security regression and domain-agent validation in CI.
- Material architecture decisions documented in ADRs.

The security verification baseline is OWASP ASVS 5.0, with stronger controls applied to authentication, authorization, payment/webhook processing, tenant boundaries, and AI execution paths.

## Current release gate

The repository has substantial application and security hardening in place, but **production readiness is not inferred from source code alone**. The remaining acceptance boundary is deployment/runtime verification.

Current source-level areas addressed by the audit include:

- Better Auth 1.7.x configuration aligned with the current stable database-joins API.
- Removal of the legacy Clerk secret fallback from production environment validation.
- Explicit organization-membership checks before portal tenant access.
- Paystack event identity, amount/currency verification, duplicate handling, and invoice transition hardening.
- Deterministic container dependency installation with the committed pnpm lockfile.
- Pinned GitHub Actions for the CI supply chain.
- FDE API trusted-host validation and strict request-correlation handling.
- Reconciled FDE gateway documentation and environment contract.

### Production verification still required

1. Production Better Auth login/session flows.
2. Authenticated `/portal` end-to-end verification.
3. Authenticated `/admin` end-to-end verification and role enforcement.
4. Production Prisma/Neon migration and transaction verification.
5. Live Paystack signature, amount/currency, idempotency, and invoice-state verification.
6. Live Tinlance → FDE API → `fde-mastery` execution verification.
7. Production timeout, retry, failure, and observability verification.
8. Final Vercel/FDE deployment smoke tests.

Do not label the platform enterprise-certified or fully production-verified until these runtime checks have current evidence.

## Documentation

- [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md) — Better Auth, sessions, organizations, RBAC, tenant isolation, and migration notes.
- [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md) — FDE API contract, domain routing, OAuth upstream authentication, tenancy, correlation, and readiness.
- [`docs/BILLING-WEBHOOKS.md`](./docs/BILLING-WEBHOOKS.md) — Paystack security, idempotency, invoice state transitions, and audit behavior.
- [`docs/ENTERPRISE-CI-GATES.md`](./docs/ENTERPRISE-CI-GATES.md) — blocking CI/security controls.
- [`docs/SECURITY-RELEASE-GATE.md`](./docs/SECURITY-RELEASE-GATE.md) — release verification requirements.
- [`docs/PHASES.md`](./docs/PHASES.md) — delivery history and current release gate.
- [`docs/DESIGN-SYSTEM.md`](./docs/DESIGN-SYSTEM.md) — visual system and UI standards.
- [`docs/DEEP-AUDIT-2026-08.md`](./docs/DEEP-AUDIT-2026-08.md) — current repository audit and remediation record.
- [`docs/decisions/`](./docs/decisions/) — architecture decision records.

## License

No open-source license is currently granted. The repository is public for transparency and engineering credibility; public visibility does not grant permission to reuse proprietary source code.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
