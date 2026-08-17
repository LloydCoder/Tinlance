# Security & Release Gate

Tinlance treats CI as a release gate. A green build is necessary but is not a security certification. Production release requires the applicable controls below to be verified against the deployed environment.

## Automated gates

- TypeScript typecheck.
- ESLint.
- Unit/integration tests.
- Production build.
- Prettier validation.
- Dependency audit.
- FastAPI lint/tests.
- AI security regression.
- Static security scanning.
- Container validation.
- SBOM generation/validation.

High/critical findings in the configured blocking security gates must fail the release.

## Identity and access

- Better Auth production authentication is verified.
- Session lifecycle is verified.
- Organization membership and RBAC are verified server-side.
- Cross-tenant access is rejected.
- Privileged operations are protected by explicit authorization.

## Data and payments

- Neon/Prisma production migrations are verified.
- Tenant-owned queries are organization-scoped.
- Paystack webhook signatures are verified before processing.
- Webhook payloads are bounded and schema-validated.
- Duplicate webhook events are idempotent.
- Payment state transitions and audit events are transactional.

## FDE trust boundary

- Tinlance → FDE API authentication is required.
- FDE API → `fde-mastery` upstream authentication is explicit.
- Supported domains are allowlisted.
- Tenant context is validated and propagated.
- Request IDs are correlated across service boundaries.
- Upstream timeouts/failures do not produce false success responses.

## Runtime security

- Secrets are supplied only through the deployment secret store.
- Production authentication/billing credentials are explicitly validated.
- CSP, HSTS, and other security headers are verified on production responses.
- Rate limiting is applied to public sensitive endpoints.
- Error responses do not disclose credentials, tokens, stack traces, or internal provider details.
- Logs contain correlation identifiers but never secret values or sensitive payment credentials.

## Resilience

- Database backup/restore procedures are documented and tested at an appropriate cadence.
- Health and readiness checks are operationally meaningful.
- Rollback procedures are documented.
- Upstream and third-party failures are observable and handled safely.

## Release rule

A PR may merge only after required CI checks are green. The final production phase is complete only after production verification items have been evidenced; documentation alone does not constitute verification.

## Compliance claim boundary

Passing this release gate does not constitute SOC 2, ISO 27001, HIPAA, PCI, or other independent compliance certification. Such claims require the applicable organizational controls, evidence, contracts, and assessment.
