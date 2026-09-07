# M3 FDE CUSTOMER WORKSPACE CERTIFICATE

## Status

**M3 FDE CUSTOMER WORKSPACE: BLOCKED**

This certificate remains BLOCKED until all implementation, security, CI, deployment and production acceptance criteria have current evidence.

## Implementation

- Branch: `feat/m3-fde-customer-workspace`
- PR: #58
- Current commit: `5988f43ab6d9709a26660096768929245c19ea1e`
- Customer routes: implemented
- Workspace API routes: implemented
- Project lifecycle: implemented
- Assessment lifecycle: implemented
- Findings lifecycle: implemented
- Evidence metadata/hash/storage boundary: implemented
- Report lifecycle/versioning: implemented
- Remediation lifecycle: implemented
- Verification workflow: implemented
- Evidence requests: implemented
- Canonical audit integration: implemented

## Security

- Better Auth remains authoritative: pending production verification
- Server-side authorization: implemented
- Organization/project isolation: implemented in workspace services
- Internal/customer visibility separation: implemented
- Evidence download authorization: implemented
- Upload validation/quota controls: implemented
- Published report immutability: implemented
- AI high-impact action boundary: documented and enforced by permission model

## FDE integration

- Browser bypass: prohibited
- Tinlance → FDE API: implemented
- Tenant propagation: implemented
- Domain allowlist: implemented
- Request correlation: implemented
- Idempotency key: implemented
- FDE API → `fde-mastery` triage path: verified in source; live execution pending

## CI

- GitHub Actions: pending green result
- Vercel status: currently blocked by Vercel build-rate limit on the current PR attempt
- Typecheck: pending
- Lint: pending
- Unit tests: pending
- Build: pending
- Dependency audit: pending
- Static security: pending
- Container validation: pending
- SBOM: pending
- Enterprise gate: pending

## Production

- Deployment: pending
- Customer login: pending
- Project flow: pending
- Assessment execution: pending
- Evidence upload/download: pending
- Findings disclosure: pending
- Report publication/download: pending
- Remediation verification: pending
- Cross-tenant denial: pending
- Audit trail: pending

## Known limitations

- Current evidence upload is bounded to 4 MiB per file.
- Malware scanning is not claimed unless separately configured.
- Canonical report output is authenticated HTML; PDF is not claimed.
- Live FDE execution must be observed in deployment.

**Certification remains BLOCKED until every blocking gate and production acceptance test is green.**
