# Security & Release Gate

This repository treats CI as a release gate. A green build alone is not a security certification; production release requires the applicable controls below to be verified against the deployed environment.

## Automated gates

- TypeScript typecheck
- ESLint
- Unit tests
- Production build
- Prettier validation
- Dependency audit (high/critical findings fail the gate)

## Required production verification

- Authentication and authorization tested with positive and negative cases.
- Tenant/org boundaries tested so one client cannot access another client's data.
- Webhook signatures verified before processing payment events.
- Rate limiting applied to public and authenticated sensitive endpoints.
- Secrets supplied only through the deployment secret store.
- Security headers verified on production responses.
- Error responses do not disclose credentials, tokens, stack traces, or internal provider details.
- Logs contain correlation identifiers but never secret values or sensitive payment credentials.
- Backup/restore procedure tested before declaring production readiness.

## Release rule

A PR may merge only after required CI checks are green. Phase 9 is complete only after the production verification items have been evidenced; documentation alone does not constitute verification.
