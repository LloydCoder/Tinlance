# Tinlance

> Production-grade AI engineering and Forward Deployed Engineering for enterprise automation, AI infrastructure, security, and intelligent systems.

Tinlance is being rebuilt from the ground up as a public engineering platform. The repository is intentionally designed to demonstrate production engineering discipline: typed application code, secure boundaries, automated validation, reproducible deployment, and a separate AI/FDE execution layer.

## Architecture

```text
Client
  │
  ▼
Next.js / Vercel
  ├── Marketing
  ├── Client Portal
  ├── Admin
  └── API
       │
       ├── Security boundary / rate limiting
       ├── PostgreSQL / Prisma
       ├── Auth / RBAC / tenant scoping
       ├── Billing
       ├── Communications
       └── FDE Mastery gateway
              │
              ▼
         FastAPI / Python
              ├── authenticated service boundary
              ├── execution contract
              ├── upstream FDE routing
              └── health / readiness / telemetry hooks
```

## Repository layout

- `apps/web` — Tinlance's Next.js application.
- `apps/web/prisma` — PostgreSQL schema and migrations.
- `apps/fde-api` — authenticated Python FastAPI gateway for FDE execution.
- `packages` — shared contracts, UI, and configuration.
- `content` — case studies, research, insights, services, and industry content.
- `docs` — architecture, security, design, and architecture decision records.
- `tests` — cross-application end-to-end and integration tests.

## Engineering standards

- TypeScript strict mode and Python 3.12 typing.
- Automated linting, type checking, tests, formatting, dependency auditing, and production builds.
- Secure-by-default HTTP headers including CSP and HSTS.
- Distributed public API rate limiting with Upstash Redis.
- Typed environment boundaries with explicit production secret validation.
- Request correlation IDs across application boundaries.
- PostgreSQL persistence through Prisma with versioned migrations.
- Server-side tenant scoping using Clerk organization identity; client-side filtering is never an authorization boundary.
- Authenticated FastAPI service-to-service execution boundary.
- Health and readiness endpoints for deployment/platform checks.
- Dependency and supply-chain security are part of CI.
- Material architecture decisions are documented.
- Public code is treated as inspectable by prospective CTOs and security teams.

## Product rebuild status

The original engineering foundation (Phases 0–9) is complete. The customer-facing product redesign is tracked separately as an 8-milestone frontend/product workstream:

1. **Design System** — brand, typography, color, spacing, motion, and reusable UI primitives. **Complete.**
2. **Marketing Homepage** — premium enterprise AI/FDE positioning and conversion experience. **Complete.**
3. **Core Marketing Pages** — FDE, AI engineering, cybersecurity, industries, services, and company pages. **Complete.**
4. **Proof & Content** — case studies, projects, OSS work, research, and blog/insights. **Complete.**
5. **Conversion System** — assessment, contact, booking, lead capture, and CTA flows. **Complete.**
6. **Client Portal** — authenticated client workspace, projects, communications, and documents. **Complete.**
7. **Admin Portal** — operational administration, leads, clients, projects, content, billing, and controls. **Complete.**
8. **Production Integration, Polish & Launch** — persistence, tenant isolation, API protection, security headers, environment validation, FastAPI integration, accessibility, responsive QA, SEO, performance, E2E, Vercel deployment, and final production verification. **Active.**

### Current milestone

**Phase 8 — Production Integration, Polish & Launch** is the active gated milestone.

Phase 8 has now addressed the previously identified architecture gaps in code:

- Lead and assessment booking submissions persist to PostgreSQL instead of returning an acknowledgement without storage.
- Public lead and booking endpoints use distributed rate limiting and request-size limits.
- CSP and HSTS are enforced alongside the existing security headers.
- Production infrastructure and authentication secrets are explicitly validated at runtime.
- Client portal project and summary data are queried through the authenticated Clerk organization boundary.
- Admin lead, client, project, billing, and dashboard surfaces use persisted records instead of placeholder operational rows where the corresponding database models exist.
- `apps/fde-api` contains an authenticated FastAPI gateway with request contracts, health/readiness endpoints, upstream routing, timeout handling, and tests.
- Prisma schema and an initial PostgreSQL migration establish the persistence boundary.
- CI now validates both the Next.js application and the FastAPI service.

### Phase 8 production gates

The final launch gate remains strict:

1. Build and integration implementation.
2. Deep security and architecture audit.
3. Fix all findings without weakening CI.
4. README updated to the current verified state.
5. Web and FastAPI CI green.
6. E2E and tenant-isolation verification green.
7. Production environment and database migration verification.
8. Vercel/FastAPI deployment verification.
9. Final production smoke test.
10. Merge only after all required checks are green.

The FastAPI gateway is a real service boundary, but the external FDE Mastery upstream must be configured through `FDE_MASTER_UPSTREAM_URL` and its service credential before upstream execution is considered production-live. The repository does not claim that external execution is live merely because the gateway exists.

## License

No open-source license is currently granted. The repository is public for transparency and engineering credibility; public visibility does not grant permission to reuse proprietary source code.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
