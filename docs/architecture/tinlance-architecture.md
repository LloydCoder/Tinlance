# Tinlance Current Architecture

Status: `CURRENT_VERIFIED` for repository structure and trust boundaries. Deployment-specific runtime claims remain separately verified.

## Product boundary

Tinlance is the public commercial and customer-facing platform for AI engineering, Forward-Deployed Engineering, AI security, and enterprise automation.

```text
Public authority
  ↓
Technical assessment / M1 commercial engine
  ↓
Lead → qualification → booking → proposal → engagement
  ↓
FDE / security delivery
```

## Application boundary

```text
Browser
  ↓
Next.js / Vercel
  ├─ public authority
  ├─ assessment + commercial workflow
  ├─ authenticated portal
  ├─ admin / operations
  └─ API routes
        ↓
Better Auth + organization/RBAC
        ↓
Prisma / PostgreSQL / Neon
        ↓
FDE API
        ↓
fde-mastery
```

## FDE boundary

Tinlance does not duplicate the FDE methodology. The current gateway contract is `POST /v1/{domain}/execute` at the Tinlance FDE API boundary and the gateway translates to the canonical FDE Mastery v1 triage contract.

FDE Mastery currently defines eight first-class domains: Cybersecurity, Finance, HealthTech, Logistics, Legal, RevOps, Procurement, and Custom. Tinlance's gateway allowlist mirrors that contract.

## Public/private boundary

Public authority content contains only publishable company, service, research and evidence information. Admin, portal, customer data, authenticated operations, service credentials and internal runtime configuration remain outside the public authority layer.

## Source-of-truth rules

- Current code and current CI are authoritative for implementation state.
- `docs/architecture/tinlance-architecture.md` is the canonical current architecture overview.
- FDE Mastery is authoritative for FDE execution methodology and its platform contracts.
- M0 migration records remain authoritative for legacy URL disposition.
- Historical handoffs are context/provenance, not implementation truth.
