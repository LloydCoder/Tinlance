# M3 FDE CUSTOMER WORKSPACE CERTIFICATE

## Status

**M3 FDE CUSTOMER WORKSPACE: BLOCKED — IMPLEMENTATION HARDENING IN PROGRESS**

This certificate remains BLOCKED until the latest implementation is merged, the exact-head preview and required workflows are green, and the live customer/FDE production acceptance tests have current evidence. A successful main deployment or source-level integration test is not a substitute for live customer acceptance.

## Implementation

- Original M3 workspace implementation: PR #58, merged.
- Evidence storage-host validation: PR #146, merged.
- Super-admin-only cross-tenant boundary: PR #147, merged.
- Evidence download integrity verification: PR #148, merged.
- Independent remediation verification enforcement: PR #149, open; latest CI and preview gates pending.
- Current main commit after PR #148: `6c8f3d59f198778f94a882aaf3e94cf0e8e003db`.
- Customer routes: implemented.
- Workspace API routes: implemented.
- Project lifecycle: implemented.
- Assessment lifecycle: implemented.
- Findings lifecycle: implemented.
- Evidence metadata/hash/private-storage boundary: implemented.
- Report lifecycle/versioning: implemented.
- Remediation lifecycle: implemented.
- Verification workflow: implemented; independent-verifier hardening is pending PR #149.
- Evidence requests: implemented.
- Canonical audit integration: implemented.

## Security

- Better Auth remains authoritative: source implementation verified; production login acceptance pending.
- Server-side authorization: implemented.
- Organization/project isolation: implemented and covered by tenant-boundary regression tests.
- Cross-tenant access: restricted to the explicit super-admin role; ordinary admin cross-tenant access is denied.
- Internal/customer visibility separation: implemented.
- Evidence download authorization: implemented.
- Evidence content hash and size verification on download: merged in PR #148.
- Upload validation/quota controls: implemented.
- Published report immutability: implemented.
- AI high-impact action boundary: documented and enforced by the permission model.
- Generic finding/remediation transitions cannot directly set `VERIFIED`: implemented on PR #149 branch; merge pending.
- Dedicated verification requires a ready remediation, a pending finding, a verifier distinct from the remediation owner, and an atomic verification/audit transaction: implemented on PR #149 branch; merge pending.

## FDE integration

- Browser bypass: prohibited.
- Tinlance → FDE API: implemented.
- Tenant propagation: implemented.
- Domain allowlist: implemented.
- Request correlation: implemented.
- Idempotency key: implemented.
- FDE API → `fde-mastery` triage path: verified in source and cross-repository CI; live deployed execution remains pending.

## CI and deployment evidence

### Main commit after PR #148

- Commit: `6c8f3d59f198778f94a882aaf3e94cf0e8e003db`.
- GitHub Actions: 17/17 main-branch workflow runs completed successfully, including web application, DAST, AI security, M6–M10, FDE/FDSE integration, enterprise validation, Phase VI, supply-chain and container validation.
- Production Vercel deployment: READY.
- Production aliases include `www.tinlance.com` and `tinlance.com`.
- Gate E production smoke workflow: successful.

### PR #149

- PR: https://github.com/LloydCoder/Tinlance/pull/149
- Purpose: enforce independent remediation verification and close the generic VERIFIED-transition bypass.
- Latest exact-head CI/security workflows: running; do not treat pending or canceled checks as green.
- Vercel preview: blocked before application build by Neon preview-branch capacity. The Neon project is at its 10-branch limit, so a preview branch for PR #149 has not been provisioned.
- This is a preview-provisioning blocker, not a production deployment failure. Production remains on the READY main deployment.
- The stale candidate identified for capacity recovery is the preview database for closed, unmerged PR #142, superseded by merged PR #143. Its deletion requires explicit approval and is not included in this certificate as completed.

## Production acceptance

The following must be exercised against the deployed environment with an authorized customer/test identity and retained evidence:

- Customer login and organization membership.
- Project creation and lifecycle.
- Assessment creation and live FDE execution through the Tinlance API into `fde-mastery`.
- Evidence upload and authenticated download, including hash/size integrity.
- Internal-versus-customer finding disclosure.
- Report publication and authenticated download.
- Customer attestation versus independent remediation verification.
- Cross-tenant denial for ordinary admins and members.
- Audit trail completeness and request correlation.

These are still pending production acceptance. CI, source tests and a READY deployment do not by themselves prove these workflows.

## Known limitations

- Current evidence upload is bounded to 4 MiB per file.
- Malware scanning is not claimed unless separately configured.
- Canonical report output is authenticated HTML; PDF generation is not claimed.
- Live FDE execution must be observed in deployment.

**Certification remains BLOCKED until PR #149 is merged with green exact-head checks, the preview is READY, and every production acceptance test above has current evidence.**
