# Tinlance

> Production-oriented AI engineering and Forward-Deployed Engineering for enterprise automation, AI security, and intelligent systems.

Tinlance is a production-oriented engineering platform with an explicit public authority layer, tenant-aware authorization, persistent data, authenticated service-to-service execution, automated security validation, and a separate FDE execution layer.

## Public foundation

The public site uses a canonical assessment funnel and exposes the engineering architecture without publishing private runtime details.

Primary public routes:

- `/assessment` — canonical technical assessment funnel.
- `/products` — public product ecosystem, with evidence/status boundaries.
- `/fde-mastery` — public FDE Mastery explanation and domain contracts.
- `/engineering` — current architecture and public engineering evidence.
- `/security` — security architecture, controls and verification baseline.
- `/about` — company, FDE philosophy and ecosystem context.
- `/work` — typed public engineering/open-source evidence and case-study taxonomy.

Production canonical URLs resolve to `https://tinlance.com`. Preview environments use their Vercel URL when no explicit `NEXT_PUBLIC_SITE_URL` is configured; local development falls back to `http://localhost:3000`. Canonical metadata, Open Graph URLs, structured data, sitemap and robots all use the same site URL resolver.

## Evidence & trust

Tinlance uses one public evidence vocabulary across engineering, products, security, FDE Mastery and work:

- **IMPLEMENTED** — exists in the current implementation; not automatically production validated.
- **TESTED** — covered by automated or reproducible tests demonstrating the stated behavior.
- **VALIDATED** — supported by documented validation beyond ordinary implementation/testing, with scope stated.
- **EXPERIMENTAL** — implemented for research/evaluation; production suitability has not been established.
- **PLANNED** — intentionally identified for future implementation and not currently implemented.

The authoritative implementation is `apps/web/lib/evidence/taxonomy.ts`, with public records in `apps/web/lib/evidence/registry.ts` and accessible rendering in `apps/web/components/evidence-status.tsx`.

Public claims follow this discipline:

```text
Claim → Evidence Status → Evidence Metadata → Source/Repository
      → Methodology → Result → Scope → Limitations
```

The public/private boundary is explicit. Private repositories, credentials, customer PII, internal endpoints and sensitive infrastructure are not published as evidence.

Case studies are typed as customer case study, engineering case study, open-source validation, research validation, synthetic evaluation or architecture case study. Customer proof is never inferred from repository tests, synthetic datasets or engineering history.

See [`docs/EVIDENCE-AND-TRUST.md`](./docs/EVIDENCE-AND-TRUST.md).

## Current architecture

The canonical current architecture is [`docs/architecture/tinlance-architecture.md`](./docs/architecture/tinlance-architecture.md).

The public `/engineering` map represents M1, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, M13 and M14. It is a public responsibility/control abstraction, not a linear infrastructure diagram or production topology. M4 Automation and M6 MCP are shown as cross-cutting relationships; FDE API/FDE Mastery form the FDE execution boundary; ThreatFade is a distinct product and evidence source.

```text
M1 Commercial Engine → M3 Customer Workspace → M5 API Platform
                                      │
                     ┌────────────────┴────────────────┐
                     ▼                                 ▼
               M7 Security                         M4 Automation
                     │                                 │
              M6 MCP / tools ────────────────→ M5 / Core
                     │
                     ▼
               M8 Evaluation → M9 Agent Runtime ↔ M10 Knowledge/RAG
                     │                              │
                     └──────────→ M11 Sales Engineer
                                                   │
                                                   ▼
                                           M12 Revenue Intelligence
                                                   │
                                                   ▼
                                           M13 Knowledge Moat
                                                   │
                                                   ▼
                                           M14 Productization

M5 → FDE API → FDE Mastery
ThreatFade = distinct security product / public engineering evidence
```

The arrows describe public control/data relationships and reading order, not a claim that every node is a hard runtime dependency of the next.

## M14 Consulting → Software Flywheel

M14 turns authorized delivery evidence into a controlled productization workflow:

```text
Observation → Pattern → Recurrence → Opportunity → Playbook → Experiment
     → Evaluation/Security → Productization decision → Reusable capability
```

M14 does not create a parallel CRM, analytics, knowledge store, workflow engine, authorization layer or agent runtime. Customer records remain in M3; cross-customer intelligence remains governed by M13; commercial truth remains in M12; M4 executes workflows; M7 authorizes sensitive actions; M8 evaluates automated/AI behavior.

See [`docs/m14-consulting-software-flywheel.md`](./docs/m14-consulting-software-flywheel.md).

## M9 Agent Runtime

M9 is the controlled execution plane for identity-bound agents. It provides immutable agent versions, explicit capabilities, durable bounded executions, controlled memory, action-bound human approvals, cancellation/recovery state and complete runtime evidence.

M9 does **not** replace M7 or M6:

```text
Agent → M9 Runtime → M7 authorization → M6 MCP boundary → M5/Core
```

Model output, memory and tool output are untrusted. M7 remains the authorization authority; M6 remains the MCP/tool boundary; M8 remains the evaluation and regression authority.

See [`apps/web/docs/security/M9_AGENT_RUNTIME.md`](./apps/web/docs/security/M9_AGENT_RUNTIME.md).

## M7 AI Security Gateway

M7 is Tinlance's cross-cutting AI security control plane for identity, tenant context, permissions, policy, deterministic risk, approvals/step-up, revocation, rate/resource controls, output filtering and auditability.

```text
Identity → Tenant → Principal → Permission → Policy → Risk
       → Approval/Step-up → Execution → Output → Audit
```

M7 extends existing Better Auth, workspace authorization, M5 API authentication, M6 MCP authorization and the existing `AuditEvent` ledger rather than introducing parallel identity or audit systems. Policy failure is fail-closed.

See [`apps/web/docs/security/m7-ai-security-gateway.md`](./apps/web/docs/security/m7-ai-security-gateway.md) and [`apps/web/docs/security/m7-threat-model.md`](./apps/web/docs/security/m7-threat-model.md).

## Repository layout

- `apps/web` — Tinlance's Next.js application.
- `apps/web/prisma` — PostgreSQL schema and migrations.
- `apps/fde-api` — authenticated Python FastAPI gateway for FDE execution.
- `docs/authority` — Authority Engine, content governance, SEO, AI discovery and research policy.
- `docs/architecture` — canonical architecture and ADRs.
- `docs` — security, operations, analytics, release and integration documentation.

## FDE boundary

Tinlance remains the public commercial/customer-facing layer. FDE Mastery remains the methodology and execution-platform authority.

The canonical FDE Mastery contract is:

```http
POST /v1/triage/{client_id}/{domain}
```

Tinlance preserves its public gateway contract and translates through the authenticated FDE boundary. The eight supported domains remain:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

M9 agents cannot choose or fabricate tenant/client identity; tenant context is resolved server-side before FDE execution.

See [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md).

## Authentication and authorization

Tinlance uses **Better Auth + Neon PostgreSQL** as its authentication authority and persistent identity store. Authorization is enforced server-side; hiding a UI element is never considered an authorization boundary.

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
- AI security regression and domain-agent validation in CI.
- M7 deterministic authorization/risk tests and persisted security-control migration validation.
- M8 evaluation/regression controls and M9 runtime security gates.

The security verification baseline is OWASP ASVS 5.0, with additional AI/agent security controls appropriate to the execution paths.

## Documentation

- [`docs/EVIDENCE-AND-TRUST.md`](./docs/EVIDENCE-AND-TRUST.md) — public evidence taxonomy, provenance and case-study rules.
- [`docs/architecture/tinlance-architecture.md`](./docs/architecture/tinlance-architecture.md) — canonical architecture.
- [`docs/m14-consulting-software-flywheel.md`](./docs/m14-consulting-software-flywheel.md) — M14 productization boundaries, lifecycle and controls.
- [`apps/web/docs/security/M9_AGENT_RUNTIME.md`](./apps/web/docs/security/M9_AGENT_RUNTIME.md) — M9 runtime architecture and controls.
- [`apps/web/docs/security/M7_AGENT_SECURITY_GATEWAY.md`](./apps/web/docs/security/M7_AGENT_SECURITY_GATEWAY.md) — M7 control plane.
- [`apps/web/docs/security/M8_AGENT_EVALUATION_PLATFORM.md`](./apps/web/docs/security/M8_AGENT_EVALUATION_PLATFORM.md) — M8 assurance plane.
- [`docs/FDE-INTEGRATION.md`](./docs/FDE-INTEGRATION.md) — FDE boundary.
- [`docs/ENTERPRISE-CI-GATES.md`](./docs/ENTERPRISE-CI-GATES.md) — blocking CI/security controls.

## Public product relationships

ThreatFade remains a distinct Tinlance-developed security product with its own public property and repository. Tinlance links to `https://threatfade.com` and the public ThreatFade repository from appropriate product/engineering surfaces. The ThreatFade web property links back to `https://tinlance.com` from its shared footer.

ThreatFade evidence is scoped to its documented methodology and test population. The public Tinlance site does not convert historical experimental results into universal accuracy, customer-deployment or certification claims.

## Homepage system map

The homepage visual labelled `FDE / SYSTEM MAP` is an architectural presentation only. It is **not live telemetry** and contains no simulated counters, events or operational data. The term `LIVE` should not be used for this visual unless a genuine telemetry source and update semantics are implemented.

## Release posture

M9 capabilities remain explicitly bounded. Unrestricted shell, arbitrary filesystem, arbitrary HTTP, direct business-database mutation, unrestricted internet access and autonomous red-team execution are not enabled by this runtime.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
