# Enterprise Operations & Release Verification

## Purpose

This document defines the evidence required before Tinlance is described as production-ready. Source-code implementation and CI success are necessary but do not, by themselves, prove that production credentials, databases, third-party integrations, or upstream services are correctly configured.

## Pre-release gates

### Application

- [ ] Next.js production build succeeds.
- [ ] Typecheck succeeds.
- [ ] ESLint succeeds.
- [ ] Unit/integration tests succeed.
- [ ] Formatting check succeeds.

### Security and supply chain

- [ ] Dependency audit has no release-blocking findings.
- [ ] Static security scanning passes.
- [ ] AI security regression passes.
- [ ] SBOM is generated and validated.
- [ ] Container validation passes.
- [ ] Secrets are absent from repository history and client bundles.

### Identity and authorization

- [ ] Better Auth production sign-in works.
- [ ] Sessions are created, refreshed, expired, and revoked correctly.
- [ ] Organization membership is enforced.
- [ ] Admin roles are enforced server-side.
- [ ] Cross-tenant access is rejected.
- [ ] Privileged operations produce appropriate audit evidence.

### Data

- [ ] Production Neon connection succeeds.
- [ ] Required Prisma migrations are applied.
- [ ] Lead/booking persistence works.
- [ ] Webhook idempotency constraint is active.
- [ ] Transactional state changes behave correctly.
- [ ] Backup and recovery procedures are documented for the production database.

### Payments

- [ ] Paystack production secret/configuration is present.
- [ ] Valid webhook signature is accepted.
- [ ] Invalid signature is rejected.
- [ ] Duplicate delivery is idempotent.
- [ ] Invoice state transition is correct.
- [ ] Audit event is persisted.

### FDE execution

- [ ] Tinlance can authenticate to the FDE API.
- [ ] FDE API can authenticate upstream to `fde-mastery`.
- [ ] Supported domain routing works.
- [ ] Tenant identity is propagated correctly.
- [ ] Request ID is propagated end-to-end.
- [ ] Agent execution returns a real result.
- [ ] Upstream timeout/failure is handled safely.
- [ ] No false success is returned during upstream outage.

### Deployment

- [ ] Vercel production deployment succeeds.
- [ ] FastAPI production deployment succeeds.
- [ ] Health endpoint succeeds.
- [ ] Readiness endpoint succeeds with production configuration.
- [ ] Security headers are present.
- [ ] Monitoring/logging captures actionable failures.
- [ ] Rollback procedure is known and tested at an appropriate cadence.

## Release evidence

A release record should identify:

- Git commit SHA;
- CI workflow/run identifiers;
- migration version;
- deployment identifiers;
- verification timestamp;
- production smoke-test result; and
- known exceptions, if any.

## Enterprise claim boundary

Passing these gates supports the statement that the software has an enterprise-oriented engineering and security foundation. It does **not** by itself constitute SOC 2 certification, ISO 27001 certification, HIPAA compliance, PCI certification, or another independent compliance attestation.

Those claims require the applicable organizational controls, evidence, contractual requirements, and independent assessment.
