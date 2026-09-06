# M3 — FDE Customer Workspace

## Purpose

M3 makes the authenticated Tinlance customer workspace the durable system of record for FDE/security engagements:

`Project → Assessment → Scope/Execution → Evidence → Findings → Risk/Prioritization → Report → Remediation → Verification → Closure`

## Architecture

```text
Customer browser
      ↓ Better Auth session
Tinlance customer workspace
      ↓ server-side authorization
Tinlance Core / workspace services
      ├── Neon PostgreSQL / Prisma
      ├── private evidence storage
      ├── canonical AuditEvent ledger
      └── FDE API
             ↓ service credential
        fde-mastery
```

The browser never calls `fde-mastery` directly. The Tinlance FDE API validates the supported domain, authenticates the service call, propagates the tenant identifier and request correlation, then invokes the upstream triage contract.

## Tenant isolation

Every workspace object carries `organizationId` and the project relationship. Server-side authorization resolves the authenticated user, active organization membership, role and requested resource before a read or mutation. Frontend filtering is not a security boundary.

Customer-visible projections exclude Tinlance-internal evidence, findings and notes.

## Project lifecycle

`DRAFT → ACTIVE → ASSESSMENT → FINDINGS_REVIEW → REPORTING → REMEDIATION → VERIFICATION → COMPLETED → ARCHIVED`

Transitions are explicitly guarded and audited. Existing M1 `Project` records are extended through `ProjectWorkspaceState`; this avoids creating a second project entity.

## Assessment

M3 extends the existing commercial `Assessment` record with `WorkspaceAssessment`. It records technical objective, explicit JSON scope, methodology/version, assessor, lifecycle and result status. FDE execution is server-only and uses `FDE_API_URL` + `FDE_SERVICE_TOKEN`.

The FDE API contract is currently `POST /v1/{domain}/execute`; that gateway translates internally to `POST /v1/triage/{tenant_id}/{domain}` in `fde-mastery`. This distinction is intentional: customers and browser code do not bypass the gateway.

Structured execution results are persisted in `WorkspaceAssessmentResult` with a SHA-256 result hash and correlation request ID.

## Evidence

Evidence is private and tenant-scoped. Metadata includes classification, collector, timestamp, hash algorithm, SHA-256 content hash, MIME type, size, integrity state, version and opaque storage reference.

Upload controls include:

- authenticated/authorized upload
- allowlisted MIME/extension pairs
- magic-byte/content validation
- bounded request size
- project file-count and storage quotas
- server-generated storage names
- private Vercel Blob access
- authorization on every download
- audit events for upload/download

Published reports reference evidence by stable IDs and hashes; storage paths are never exposed as the customer-facing contract.

## Findings

Findings have explicit severity, lifecycle, visibility, risk metadata and authorship classification. Internal findings remain hidden until explicitly reviewed/published. Finding status is independent from remediation status.

## Reports

Reports are versioned immutable deliverables. The generator creates deterministic HTML and a SHA-256 content hash. Published content is not edited in place. Corrections require a new report version.

Reports are traceable through assessment → finding → evidence → remediation.

## Remediation and verification

Remediation states distinguish customer work from independent verification. `CUSTOMER_ATTESTED` is not equivalent to `VERIFIED`.

Verification records verifier, method, result, timestamp and optional evidence. A passing verification moves the finding to `VERIFIED`; failed verification keeps the remediation open for further work.

## Audit

M3 reuses the existing `AuditEvent` model. It does not introduce a second audit log. Customer activity is a filtered project/resource projection of that canonical ledger.

Sensitive evidence content and secrets are not written to audit metadata.

## AI boundary

M3 stores authorship metadata for AI-assisted/generated finding content, but no M3 AI workflow can autonomously publish a report, verify remediation, close a finding, grant access or delete evidence. AI inputs remain untrusted evidence; high-impact actions remain human-authorized.

## Security baseline

M3 is designed against OWASP ASVS 5.0.0, with particular attention to trusted-layer input validation, authorization, file upload/content validation, private storage, download controls, logging and data protection. Assessment evidence/reporting follows the project’s NIST SP 800-115 framing, and remediation/posture work can be mapped to NIST CSF 2.0 without treating the mapping as certification.

## Required production configuration

Evidence storage:

- `BLOB_READ_WRITE_TOKEN`

FDE execution:

- `FDE_API_URL`
- `FDE_SERVICE_TOKEN`

Production deployment must verify these secrets are present without exposing their values.

## Routes

Customer UI:

- `/portal/projects`
- `/portal/projects/[projectId]`
- `/portal/projects/[projectId]/assessments`
- `/portal/projects/[projectId]/findings`
- `/portal/projects/[projectId]/evidence`
- `/portal/projects/[projectId]/reports`
- `/portal/projects/[projectId]/remediation`
- `/portal/projects/[projectId]/activity`
- `/portal/projects/[projectId]/team`

Server API families:

- `/api/v1/workspace/projects/*`
- `/api/v1/workspace/assessments/*`
- `/api/v1/workspace/findings/*`
- `/api/v1/workspace/evidence/*`
- `/api/v1/workspace/reports/*`
- `/api/v1/workspace/remediation/*`
- `/api/v1/workspace/evidence-requests/*`

## Current limitations

- The workspace currently uses a bounded server upload path; the 4 MiB limit is deliberate for the current deployment/runtime and should be replaced with authorized direct-to-private-object-storage multipart uploads if larger evidence artifacts become a requirement.
- Malware scanning is not claimed by M3 unless an existing deployment scanner is configured. Evidence is therefore treated as untrusted data and is never executed by the application.
- PDF generation is not claimed by the initial M3 implementation; the canonical customer report is accessible as authenticated HTML.
- Live deployed Tinlance → FDE API → `fde-mastery` execution remains a production acceptance test and must be observed before certification.
