# Tinlance Deep Enterprise Audit — August 2026

## Scope

This audit reconciles the Tinlance project handoff material, current `LloydCoder/Tinlance` repository state, the connected `fde-mastery` repository where the trust boundary matters, current GitHub branch/PR state, and current security/platform guidance.

Historical handoff documents were treated as context, not proof. The repository and current GitHub state were treated as the implementation source of truth.

## Current repository baseline

- Tinlance main at audit start: `32c54a389ae8338cdf008800053f13c0c0ca3748` (2026-08-20).
- Current FDE Mastery main observed: `be4a40a49880938d7fe6e2a5ba291d7e1f841bd4` (2026-08-21, Build 29 merge).
- A stale diagnostic Tinlance PR #18 was open with an explicit “do not merge” description; it was closed during this audit.
- Remediation branch: `fix/deep-enterprise-audit-2026-08`.
- Remediation PR: #43.

## Research baseline

### Better Auth

Better Auth 1.7.1 is the current release observed on August 23, 2026. The 1.7 release moved database joins from the experimental configuration into `advanced.database.joins`, and 1.7.1 includes migration-safety fixes and refreshed dependencies. Tinlance's lockfile already resolved Better Auth 1.7.1, while the package manifest still declared the older 1.6 range. The manifest was aligned with the locked release.

### Next.js

Next.js 15.5.21 is a Maintenance LTS line and was the current security baseline in the July 2026 security release. Next.js 16.3 is current Active LTS, but upgrading a production application across a major line was deliberately not bundled into this security hardening patch. The August 26, 2026 scheduled security release should be rechecked before the next production release.

### OWASP

The project baseline remains OWASP ASVS 5.0. The audit focused particularly on authentication, authorization, tenant isolation, webhook integrity, supply chain, request correlation, and AI/FDE trust boundaries.

### GitHub Actions

Enterprise CI now pins first-party and third-party GitHub Actions to reviewed commit SHAs rather than mutable version tags. This reduces the CI supply-chain risk from tag movement or compromised releases.

### FastAPI

FastAPI/Starlette's `TrustedHostMiddleware` is used to reject unexpected Host headers. The production host list is explicitly configured through `FDE_ALLOWED_HOSTS`; the local default remains intentionally narrow.

## Findings and remediation

### 1. Tenant authorization depended too heavily on active-session organization state

**Risk:** A tenant boundary should not trust an organization identifier merely because it is present in session state. Every protected resource read should be bound to an authenticated user's actual membership.

**Fixed:** `requireOrganization` and `ensureOrganization` now require the authenticated user ID and resolve the organization through the `(organizationId, userId)` membership relation. Portal overview, projects, documents, messages, and settings now use that membership-bound lookup.

### 2. Privileged-role checks could rely on cached session user data

**Risk:** A privileged role is a security-sensitive revocation boundary. Authorizing from a cached session user object can allow a recently revoked administrator to retain access until the session cache refreshes.

**Fixed:** `getAuthorizationContext()` now reads the current user role directly from PostgreSQL while separately resolving organization membership. Privileged operations therefore use the database as the authoritative role-revocation boundary rather than the potentially cached session representation.

### 3. Legacy Clerk secret fallback remained in environment validation

**Risk:** Keeping a legacy authentication secret as a fallback obscures the active security authority and can create configuration ambiguity during migration.

**Fixed:** Production validation now requires Better Auth configuration and no longer falls back to a Clerk secret.

### 4. Better Auth package manifest lagged behind the locked dependency

**Risk:** The lockfile was resolving Better Auth 1.7.1 while the application manifest declared the older 1.6 range. This creates dependency-contract ambiguity and blocks clean reproducibility when the lockfile is regenerated.

**Fixed:** `better-auth` and `@better-auth/prisma-adapter` now declare the 1.7.1 line already represented in the lockfile, and the current `advanced.database.joins` configuration is used.

### 5. Paystack webhook event identity and state transitions were too permissive

**Risk:** Falling back to a payment reference when an event ID is absent weakens event identity. Payment state changes also need financial integrity checks and must not regress terminal states.

**Fixed:**

- Require the provider event ID from the event payload.
- Preserve `(provider, eventId)` idempotency.
- Match invoice amount and currency before state changes.
- Reject ambiguous invoice references and record an audit event.
- Prevent invalid invoice state regressions, including changes after `refunded`.
- Preserve request correlation and safe duplicate handling.

**Database follow-up:** A unique constraint/index on non-null invoice provider references should be added after production data is inspected for duplicates. The connected Neon search did not expose the Tinlance project, so no production database mutation was attempted from this audit.

### 6. Web container dependency installation was not fully deterministic

**Risk:** A container build using a non-frozen install can resolve a different dependency graph from CI or production.

**Fixed:** The web Dockerfile now copies the committed pnpm lockfile and uses `pnpm install --frozen-lockfile`.

### 7. FDE API lacked an explicit Host-header trust boundary

**Risk:** APIs exposed behind proxies should not accept arbitrary Host headers.

**Fixed:** `TrustedHostMiddleware` is enabled. Production deployments must explicitly configure `FDE_ALLOWED_HOSTS`.

### 8. FDE request correlation accepted arbitrary strings

**Risk:** Arbitrary correlation IDs can pollute logs, tracing, and cross-service telemetry.

**Fixed:** Incoming `x-request-id` values are accepted only when they parse as UUIDs; otherwise a fresh UUID is generated.

### 9. CI action references were mutable tags

**Risk:** A tag can move independently of the reviewed source commit, weakening the CI supply-chain boundary.

**Fixed:** Checkout, package setup, Node/Python setup, Docker actions, Trivy, SBOM generation, and artifact upload are pinned to reviewed commit SHAs.

### 10. Documentation drift existed at the FDE boundary

**Risk:** The FDE README described planned `/v1/jobs` endpoints while the actual implementation exposes `/v1/execute`.

**Fixed:** FDE documentation now reflects the current contract, security controls, environment requirements, and production caveats.

### 11. Production claims needed stronger separation from source-level evidence

**Risk:** A green source/CI pipeline does not prove production configuration, payment integration, identity behavior, or upstream FDE connectivity.

**Fixed:** Root documentation now explicitly separates source-level implementation from production runtime acceptance tests.

## Cross-repository audit observation

`fde-mastery` is substantially further along as a platform control plane. Its current README describes tenant-aware identity, policy, human approval, tool/model boundaries, durable workflows, auditability, evaluation, incident management, supply-chain controls, and deployment isolation. The latest observed main commit is Build 29, covering secrets and cryptographic-key lifecycle.

The architectural implication is important: Tinlance should remain a thin authenticated commercial/application boundary and should not duplicate the policy, agent, tool, model, evaluation, or secret-lifecycle control planes already being built in `fde-mastery`.

## Remaining acceptance gaps

These were intentionally not represented as “fixed” because they require live infrastructure or a larger architectural change:

1. Production Better Auth login/session verification.
2. Production organization-switching and cross-tenant negative tests.
3. Production Neon migration and transaction verification.
4. Live Paystack webhook replay, duplicate, mismatch, and terminal-state tests.
5. Live Tinlance → FDE API → `fde-mastery` authentication and tenant propagation tests.
6. Production FDE host policy configuration.
7. Runtime observability and alerting verification.
8. Production backup/restore and disaster-recovery evidence.
9. Formal enterprise SSO/OIDC/SAML rollout when customer demand justifies it.
10. Full API/MCP policy gateway architecture before exposing agent-facing capabilities.

These are release-acceptance items, not reasons to add speculative features.

## Architectural priorities after this audit

1. Finish and prove the current release gate.
2. Centralize business logic before adding API/MCP surfaces.
3. Keep user authorization and organization membership authoritative in Tinlance.
4. Keep agent/tool/model/policy execution authority in `fde-mastery` or a dedicated Tinlance security gateway rather than duplicating it in web routes.
5. Add production evidence before declaring enterprise readiness.
6. Re-run dependency/security research before each production release, especially around the scheduled Next.js August 26 security release.

## Audit conclusion

The repository had a strong foundation but contained several meaningful gaps between its stated enterprise posture and its actual implementation. The remediation branch addresses the highest-confidence source-level gaps found in this audit without introducing a speculative platform rewrite.

The correct next step is CI verification of PR #43 followed by deployment-level verification. A green CI run should be treated as evidence for the changed source and build gates, not as proof of production certification.
