# M4 — Tinlance FDE Automation

## Implemented boundary

Tinlance customer/internal interfaces invoke the Tinlance core workflow service. FDE execution remains behind the authenticated Tinlance FDE API gateway:

`Tinlance Core → Workflow Engine → FDE API → POST /v1/triage/{client_id}/{domain} → FDE Mastery`

The browser never calls FDE Mastery directly.

## Durable execution

M4 uses PostgreSQL-backed workflow state rather than browser state or an in-memory queue. A Vercel cron invokes `/api/internal/automation/worker` every five minutes. The worker claims eligible runs with `FOR UPDATE SKIP LOCKED` and a lease. A lease expiry makes a run recoverable after worker interruption. Retry timing is persisted in `next_run_at`.

The worker processes bounded steps. Long FDE calls have explicit timeouts. The customer does not need to keep a browser tab open.

## Versioning

Playbooks and versions are immutable execution references. A run stores the exact playbook-version ID and every step stores its pinned FDE capability ID/version. Activating a newer version does not rewrite historical runs.

The initial global playbook is **FDE Technical Assessment v1.0.0**. It is intentionally narrow:

1. validate scope
2. execute the cybersecurity FDE triage capability
3. persist result/provenance
4. normalize findings
5. request supporting evidence
6. generate a draft report
7. human approval gate
8. publish report
9. create remediation items
10. collect verification input
11. close the project workspace
12. schedule a 90-day reassessment

## Human control

Report publication is explicitly gated. Approval decisions are single-use, tenant-scoped, recorded with actor and timestamp, and audited. Customer-controlled evidence is treated as untrusted content and is never interpreted as workflow instructions.

M4 does not introduce unrestricted AI agents, shell access, arbitrary browser automation, or autonomous production changes.

## Idempotency

External workflow starts require `Idempotency-Key`. Database uniqueness on `(organization_id, idempotency_key)` prevents duplicate runs. FDE execution uses a deterministic run/step idempotency key. Findings, reports and remediation records also use workflow-derived idempotency keys.

## Failure handling

Transient gateway failures, 429 responses, 5xx responses and timeouts can retry according to the pinned step policy with bounded exponential backoff. Validation, authorization and policy failures are not retried automatically. Operators can pause, resume, retry a failed run, or cancel it through RBAC-protected controls.

## Tenant isolation

Every run, step, approval, artifact and event is bound to an organization. Project ownership is verified server-side before a run starts. Read/control endpoints filter by the authenticated organization. Global operators use Better Auth global roles for the internal control plane; no second authorization system exists.

## Provenance

The execution chain is preserved as:

`organization → project → assessment → workflow run → workflow version → step → capability/version → artifact → finding/report/remediation`

FDE results are hashed and stored as workflow artifacts. AI-assisted findings are explicitly marked as such in the M3 workspace model.

## Scheduling

Schedules are persisted with interval, timezone, next-run and provenance fields. The current playbook schedules a 90-day reassessment after successful closure. Duplicate scheduled runs are prevented through the same tenant/idempotency constraints used for manual starts.

## Security baseline

M4 follows the project security baseline and current external guidance. OWASP ASVS 5.0.0 is the application verification baseline. OWASP's 2026 Agentic Applications guidance is applied to excessive agency, tool misuse and identity/privilege boundaries. NIST AI RMF and its Generative AI Profile inform AI provenance, risk management and evaluation. See the CI security gates for static scanning, dependency audit, container scanning, SBOM and AI security regression.

## Operational questions answered

The workflow API exposes run state, pinned playbook version, step history, approvals, artifacts, events, request ID and errors. Operators can therefore determine who/what started a run, its tenant, workflow version, executed steps, FDE capability, failures/retries, approval decisions and resulting artifacts.

## Deliberate scope boundary

M4 does not introduce a second queue, CRM, auth system, notification platform, or autonomous agent runtime. The first playbook only automates capabilities already available through FDE Mastery. New playbooks must be versioned and must pass workflow validation/security tests before activation.
