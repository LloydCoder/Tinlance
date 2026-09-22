# Gate F — Scale / SaaS

Gate F hardens the stable API and productization layer for scalable SDK consumption, usage accounting, incident response, and governed software leverage.

## Phase coverage

- **36 — SDKs:** `packages/sdk-typescript` and `packages/sdk-python` target the stable v1 OpenAPI contract and require runtime API keys.
- **37 — Usage pricing:** organization-scoped immutable `UsageEvent` records, idempotent on request ID + metric, explicit plan/rate catalog, and privileged usage summaries. Rates are engineering defaults, not customer-facing pricing claims.
- **40 — Incident response:** explicit SEV1–SEV4 incident taxonomy, fail-closed state transitions, incident event history, request correlation, and audit records.
- **42 — AI Sales Engineer:** existing M11 public-only, evidence-grounded sales assistant remains the conversion surface.
- **43 — Personalization:** contextual personalization must remain non-invasive and evidence-backed; no customer/private-data personalization is introduced by Gate F.
- **44 — Revenue Intelligence:** M12 remains the commercial analytics source; it does not replace accounting truth and does not infer visitor attribution.
- **45 — Knowledge Moat:** M13 remains permissioned, minimized, approval-gated and revocable.
- **46 — Consulting → Software:** M14 remains evidence-backed, human-approved and downstream of M13/M8/M7 boundaries.

## API scale/security contract

OWASP API Security Top 10 requires object-level and function-level authorization, controls against unrestricted resource consumption, secure configuration, and an accurate API inventory. Gate F therefore meters authenticated API usage, retains bounded rate classes, preserves v1 OpenAPI inventory, and keeps tenant authorization in the API service layer.

## Operational semantics

Usage is immutable accounting telemetry. Duplicate delivery of the same request/metric is ignored by a database uniqueness constraint. Aggregation is organization-scoped and currency-aware at the plan level.

Incident state changes are explicit and auditable. AI agents cannot be granted incident approval authority by this gate; existing human authorization boundaries remain authoritative.

## Non-claims

Gate F does not claim payment/accounting certification, uptime guarantees, legal compliance, GDPR/ISO/SOC certification, product-market fit, or customer adoption.

## Verification

- `Gate F SDK + Scale Contracts` validates TypeScript SDK compilation, Python SDK installation/tests, usage/incident unit contracts, and formatting.
- Existing CI continues to validate Prisma migrations, application build/typecheck/lint/tests, security regression, container hardening and SBOM.
- Production deployment verification remains separate from repository CI.

Gate F verification also requires the post-migration application CI to pass; generated authentication artifacts produced by the existing Gate A bootstrap workflow remain part of the repository's verified build state.
