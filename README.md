# Tinlance

> Production-oriented AI engineering and Forward-Deployed Engineering for enterprise automation, AI security, and intelligent systems.

Tinlance is a production-oriented engineering platform with an explicit public authority layer, tenant-aware authorization, persistent data, authenticated service-to-service execution, automated security validation, and a separate FDE execution layer.

## Current architecture

The canonical current architecture is [`docs/architecture/tinlance-architecture.md`](./docs/architecture/tinlance-architecture.md).

```text
Public authority
  │
  ▼
Technical assessment / M1 commercial engine
  │
  ▼
Lead → qualification → booking → proposal → engagement
  │
  ▼
Next.js / Vercel → Better Auth → PostgreSQL / Prisma / Neon
  │
  ▼
M7 AI Security Gateway
  │
  ├── M5 API Platform
  └── M6 MCP Gateway
          │
          ▼
     M4 Automation → Tinlance FDE API → fde-mastery
```

The public authority layer includes services, research, insights, guides, case studies, documentation and resources. It feeds the existing assessment/commercial workflow; it does not replace the commercial engine.

## M7 AI Security Gateway

M7 is Tinlance's cross-cutting AI security control plane for identity, tenant context, permissions, policy, deterministic risk, approvals/step-up, revocation, rate/resource controls, output filtering and auditability.

```text
Identity → Tenant → Principal → Permission → Policy → Risk
       → Approval/Step-up → Execution → Output → Audit
```

M7 extends existing Better Auth, workspace authorization, M5 API authentication, M6 MCP authorization and the existing `AuditEvent` ledger rather than introducing parallel identity or audit systems. Policy failure is fail-closed. AI prompts, retrieved documents, MCP metadata and tool descriptions are untrusted data and never become authorization decisions.

See [`docs/security/m7-ai-security-gateway.md`](./docs/security/m7-ai-security-gateway.md) and [`docs/security/m7-threat-model.md`](./docs/security/m7-threat-model.md).

## Repository layout

- `apps/web` — Tinlance's Next.js application.
- `apps/web/prisma` — PostgreSQL schema and migrations.
- `apps/fde-api` — authenticated Python FastAPI gateway for FDE execution.
- `docs/authority` — Authority Engine, content governance, SEO, AI discovery and research policy.
- `docs/architecture` — canonical architecture and ADRs.
- `docs/migrations` — M0 legacy-site discovery and redirect evidence.
- `docs` — security, operations, analytics, release and integration documentation.

## Authority Engine

M2 establishes the public authority layer around four commercial pillars:

- AI Engineering
- Forward-Deployed Engineering
- AI Security
- Enterprise Automation

Supporting authority topics include cybersecurity, AI agents, RAG, production AI, AI infrastructure and security engineering.

Canonical authority routes include:

- `/services`
- `/research`
- `/case-studies`
- `/guides`
- `/documentation`
- `/insights`
- `/resources`
- `/assessment`

Research and case-study content uses explicit status and evidence classifications. Historical ThreatFade results are preserved as historical MVP evidence rather than current universal production guarantees.

## FDE boundary

Tinlance remains the public commercial/customer-facing layer. FDE Mastery remains the methodology and execution-platform authority.

The current Tinlance FDE API contract is:

```http
POST /v1/{domain}/execute
```

The gateway supports the eight current FDE Mastery domains:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

The gateway translates to the canonical FDE Mastery v1 triage contract. See [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md).

## Authentication and authorization

Tinlance uses **Better Auth + Neon PostgreSQL** as its authentication authority and persistent identity store. Clerk is not part of the active authentication path.

Authorization follows:

```text
Authentication → Session → User → Organization → Membership → Role → Permission → Resource
```

Authorization is enforced server-side; hiding a UI element is never considered an authorization boundary.

See [`docs/AUTHENTICATION.md`](./docs/AUTHENTICATION.md).

## Billing and webhook reliability

Paystack webhooks are authenticated, replayable events rather than trusted callbacks. Controls include payload-size protection, HMAC signature verification, event-shape validation, event identity persistence, duplicate handling, invoice amount/currency checks, monotonic invoice transitions, transactional updates, audit events and request correlation.

See [`docs/BILLING-WEBHOOKS.md`](./docs/BILLING-WEBHOOKS.md).

## Engineering and security standards

- TypeScript strict mode and Python 3.12 typing.
- Automated linting, type checking, tests, formatting, dependency auditing, security scanning, SBOM validation, container validation, and production builds.
- Secure HTTP headers including CSP and HSTS.
- Distributed public API rate limiting with Upstash Redis.
- Typed environment boundaries with explicit production secret validation.
- Request correlation across application boundaries.
- PostgreSQL persistence through Prisma with versioned migrations.
- Server-side tenant scoping.
- Authenticated FastAPI service-to-service execution boundary.
- OAuth 2.0 upstream authentication for production FDE execution.
- Trusted-host enforcement for the FDE API.
- Health and readiness endpoints.
- Dependency and software-supply-chain security as blocking CI controls.
- AI security regression and domain-agent validation in CI.
- M7 deterministic authorization/risk tests and persisted security-control migration validation.

The security verification baseline is OWASP ASVS 5.0, with additional AI/agent security controls appropriate to the execution paths.

## Current delivery status

M0–M6 implementation remains the compatibility baseline. M7 is being implemented as the security control plane beneath the existing M5/M6 surfaces. Production deployment verification remains separate from repository/CI verification; the current Vercel deployment limit is a temporary external constraint and is not bypassed by the M7 work.

## Documentation

- [`docs/architecture/tinlance-architecture.md`](./docs/architecture/tinlance-architecture.md) — canonical current architecture.
- [`docs/security/m7-ai-security-gateway.md`](./docs/security/m7-ai-security-gateway.md) — M7 control-plane implementation.
- [`docs/security/m7-threat-model.md`](./docs/security/m7-threat-model.md) — M7 threat model and residual risks.
- [`docs/authority/authority-engine.md`](./docs/authority/authority-engine.md) — Authority Engine architecture.
- [`docs/authority/content-model.md`](./docs/authority/content-model.md) — content and evidence model.
- [`docs/authority/content-governance.md`](./docs/authority/content-governance.md) — publishing and evidence gate.
- [`docs/authority/seo.md`](./docs/authority/seo.md) — technical SEO contract.
- [`docs/authority/ai-discovery.md`](./docs/authority/ai-discovery.md) — AI crawler/discovery policy.
- [`docs/authority/research-policy.md`](./docs/authority/research-policy.md) — research methodology and evidence policy.
- [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md) — current FDE gateway contract.
- [`docs/ENTERPRISE-CI-GATES.md`](./docs/ENTERPRISE-CI-GATES.md) — blocking CI/security controls.
- [`docs/migrations/LEGACY_SITE_MIGRATION_CERTIFICATE.md`](./docs/migrations/LEGACY_SITE_MIGRATION_CERTIFICATE.md) — M0 migration evidence.
- [`docs/PHASES.md`](./docs/PHASES.md) — current delivery phases.

## License

No open-source license is currently granted. The repository is public for transparency and engineering credibility; public visibility does not grant permission to reuse proprietary source code.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
