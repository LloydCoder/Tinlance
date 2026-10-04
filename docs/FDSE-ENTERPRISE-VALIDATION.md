# FDSE Enterprise Validation

## Status

Phase V converts the FDSE initiative's 28 validation layers into executable CI evidence. The phase is intentionally a validation gate, not a declaration that architecture documentation alone constitutes enterprise readiness.

## Validation basis

Current public guidance used for the gate includes NIST AI RMF 1.0, NIST SSDF 1.1, NIST SP 800-61 Rev. 3, OWASP Top 10 for Agentic Applications 2026, OWASP API Security Top 10 2023, and SLSA v1.2. These references provide vocabulary and validation criteria; they do not create compliance, certification, customer proof, or production SLO claims.

## 28-layer matrix

| # | Layer | Executable evidence |
|---:|---|---|
| 1 | Unit | Web and FDE API tests |
| 2 | Contract | Required integration contracts |
| 3 | Cross-repository contract | Cross-system workflows |
| 4 | Integration | Typecheck, lint, production build |
| 5 | Security | Semgrep OWASP/JS/Python rules |
| 6 | Adversarial | AI security regression suite |
| 7 | Property/invariant | Explicit fail-closed/evidence invariants |
| 8 | Failure injection | Rejection/auth/fail-closed test evidence |
| 9 | Workflow recovery | Retry/recovery/lease/cancellation/idempotency evidence |
| 10 | Memory/context security | M9 runtime security contract |
| 11 | Multi-agent | Agent identity/delegation/runtime evidence |
| 12 | MCP/tool security | MCP/tool security-boundary evidence |
| 13 | Supply chain | pnpm audit + pip-audit |
| 14 | Provenance | Immutable action and repository revisions |
| 15 | E2E | Production build + local FDSE/health route |
| 16 | Performance | 50 concurrent health requests with bounded p95 |
| 17 | Load | 100 concurrent FDSE route requests |
| 18 | Concurrency | 100 concurrent health requests |
| 19 | Tenant isolation | Tenant/auth/organization tests |
| 20 | Migration | Prisma migration deployment |
| 21 | Disaster recovery | PostgreSQL dump/drop/restore probe |
| 22 | Observability | Health + correlation/audit evidence |
| 23 | Documentation | Required architecture/evidence documents |
| 24 | API compatibility | Canonical FDE API routes/domains |
| 25 | Dependency security | Audit + dependency consistency |
| 26 | CI/CD | Blocking enterprise/cross-system workflows |
| 27 | Release certification | Clean tree + evidence taxonomy |
| 28 | Production readiness | Canonical FDSE/sitemap/health checks |

## Evidence boundary

Synthetic performance/load is a CI characterization, not a production capacity claim.

The PostgreSQL recovery test validates dump/drop/restore behavior in the CI database fixture using a native PostgreSQL connection URL without Prisma's `schema=public` query parameter. It is not proof of the live Neon backup/restore configuration.

Production checks validate the current public origin only. They do not prove a live customer FDSE execution path; docs/FDE-INTEGRATION.md continues to mark the authenticated live FDE path as unverified until it is actually observed.

## Python dependency-audit boundary

The FDE API is installed into CI as an editable local package (`pip install -e 'apps/fde-api[test]'`). The released `pip-audit 2.10.1` supports `--skip-editable`, but its current released behavior can still fail while collecting an editable distribution; upstream has an unreleased fix for this path. To keep the gate deterministic without suppressing dependency findings, CI first generates a requirements snapshot with `pip freeze --local --exclude-editable`, asserts that the local `tinlance-fde-api` project is absent, and audits that snapshot with `pip-audit --strict -r`. This excludes only the local project distribution while retaining its installed third-party dependencies and test dependencies for vulnerability auditing. citeturn3search0turn3search5

## Completion gate

Phase V is complete only when every layer passes, existing Tinlance CI is green, Phase IV remains green, documentation is reconciled, and the implementation is merged with all required checks green.

## Research references

- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- NIST SSDF 1.1: https://www.nist.gov/publications/secure-software-development-framework-ssdf-version-11-recommendations-mitigating-risk
- NIST SP 800-61 Rev. 3: https://csrc.nist.gov/pubs/800/61/r3/final
- OWASP Top 10 for Agentic Applications 2026: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- OWASP API Security Top 10: https://api-security.owasp.org/editions/2023/en/0x11-t10/
- SLSA v1.2: https://slsa.dev/spec/v1.2/
