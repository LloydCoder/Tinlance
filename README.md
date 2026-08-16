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
       ├── Security boundary
       ├── PostgreSQL / Prisma
       ├── Auth / RBAC
       ├── Billing
       ├── Communications
       └── FDE Mastery API
              ├── Agent Router
              ├── Domain Agents
              ├── RAG
              ├── Tools / MCP
              └── Evaluation / Telemetry
```

## Repository layout

- `apps/web` — Tinlance's Next.js application.
- `apps/fde-api` — reserved boundary for the Python FDE execution service.
- `packages` — shared contracts, UI, and configuration.
- `content` — case studies, research, insights, services, and industry content.
- `docs` — architecture, security, design, and architecture decision records.
- `tests` — cross-application end-to-end and integration tests.

## Engineering standards

- TypeScript strict mode.
- Automated linting, type checking, tests, and production builds.
- Secure-by-default HTTP headers.
- Typed environment boundaries and no secret values in source control.
- Request correlation IDs for application observability.
- Health and readiness endpoints for deployment/platform checks.
- Dependency and supply-chain security are part of CI.
- Material architecture decisions are documented.
- Public code is treated as inspectable by prospective CTOs and security teams.
- Presentation-critical files may use intentionally hand-tuned formatting; `.prettierignore` documents those narrow exceptions while CI continues to enforce formatting on the rest of the changed source and documentation surface.

## Product rebuild status

The original engineering foundation (Phases 0–9) is complete. The customer-facing product redesign is tracked separately as an 8-milestone frontend/product workstream:

1. **Design System** — brand, typography, color, spacing, motion, and reusable UI primitives. **Complete.**
2. **Marketing Homepage** — premium enterprise AI/FDE positioning and conversion experience. **Complete.**
3. **Core Marketing Pages** — FDE, AI engineering, cybersecurity, industries, services, and company pages. **Complete.**
4. **Proof & Content** — case studies, projects, OSS work, research, and blog/insights. **Complete.**
5. **Conversion System** — assessment, contact, booking, lead capture, and CTA flows. **Active.**
6. **Client Portal** — authenticated client workspace, projects, communications, and documents. **Pending.**
7. **Admin Portal** — operational administration, leads, clients, projects, content, billing, and controls. **Pending.**
8. **Production Polish & Launch** — accessibility, responsive QA, SEO, performance, security, E2E, Vercel deployment, and final production verification. **Pending.**

### Current milestone

**Phase 5 — Conversion System** is the active gated milestone. This phase turns Tinlance's positioning into a disciplined assessment and lead-capture funnel without making unsupported promises or exposing sensitive data.

Current Phase 5 scope:

- Technical assessment request page at `/assessment`.
- Validated assessment booking API boundary at `/api/v1/operations/booking`.
- Structured lead capture form on `/contact`.
- Validated lead API boundary at `/api/v1/operations/lead`.
- Primary navigation CTA routed to the technical assessment.
- Accessible labels, focus states, native validation, and error/status messaging.
- Honeypot bot mitigation and bounded request-body handling on lead capture.
- Request correlation IDs and `no-store` response controls on conversion endpoints.
- README status tracking.

The conversion layer deliberately separates public intake from downstream persistence/CRM workflows so future portal and admin phases can own authenticated operational data without coupling the marketing surface to a database prematurely.

**Gate:** Build → deep audit → fix → README update → CI green → merge → next milestone.

No subsequent frontend milestone will be treated as complete until its predecessor has passed this gate.

## License

No open-source license is currently granted. The repository is public for transparency and engineering credibility; public visibility does not grant permission to reuse proprietary source code.

## Security

See [`SECURITY.md`](./SECURITY.md) for vulnerability reporting and the security baseline.
