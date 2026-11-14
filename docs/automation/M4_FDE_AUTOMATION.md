# M4 — Tinlance FDE Automation

## Implemented boundary

Tinlance customer/internal interfaces invoke the Tinlance core workflow service. FDE execution remains behind the authenticated Tinlance FDE API gateway:

`Tinlance Core → Workflow Engine → FDE API → POST /v1/triage/{client_id}/{domain} → FDE Mastery`

The browser never calls FDE Mastery directly.

## Durable execution

M4 uses PostgreSQL-backed workflow state rather than browser state or an in-memory queue. A Vercel cron invokes `/api/internal/automation/worker` every five minutes. The worker claims eligible runs with `FOR UPDATE SKIP LOCKED` and a lease. A lease expiry makes a run recoverable after worker interruption. Retry timing is persisted in `next_run_at`.

The worker processes bounded steps. Playbook definitions must declare bounded `maxSteps` and `maxDurationSeconds`; step timeouts and retry policies are validated before execution. A run that exceeds its configured maximum duration is expired and audited. Pause/cancel controls cannot be overwritten by a late worker completion or failure.

The customer does not need to keep a browser tab open. Waiting for customer evidence, finding review, or independent remediation verification is persisted as a WAITING state and is rechecked by the worker.

## Versioning

Playbooks and versions are immutable execution references. A run stores the exact playbook-version ID and every step stores its pinned FDE capability ID/version. Activating a newer version does not rewrite historical runs.

The initial global playbook is **FDE Technical Assessment v1.0.0**. It is intentionally narrow:

1. validate scope and move the project workspace into assessment
2. execute the cybersecurity FDE triage capability
3. persist result/provenance
4. normalize findings as internal-only AI-assisted findings
5. request supporting evidence; the evidence request is created before the workflow waits, and the submitted evidence is tenant-, project- and assessment-scoped
6. wait until every generated finding has been reviewed and explicitly made customer-visible or otherwise dispositioned; internal findings are never included in customer reports
7. generate a draft report using only customer-visible findings and evidence associated with the current assessment or project-level evidence
8. human approval gate; the approver moves the report through DRAFT → INTERNAL_REVIEW → APPROVED
9. publish the report only from APPROVED, recording the actual approver as publisher
10. create remediation items only for customer-visible actionable findings
11. wait for M3 independent verification; M4 does not accept customer-supplied verification results or create verification records itself
12. move the project workspace through guarded remediation/verification/completion states and schedule a 90-day reassessment

## Human control and verification boundary

Report publication is explicitly gated. Approval decisions are single-use, tenant-scoped, bound to the current approval step, recorded with actor and timestamp, and audited.

Customer-controlled evidence is treated as untrusted content and is never interpreted as workflow instructions. The workflow input endpoint accepts only a tenant/project/assessment-validated evidence ID. It rejects verification evidence, verification results, verifier identity, report IDs, and arbitrary workflow-state fields.

**Independent remediation verification belongs exclusively to the M3 verification service.** M4 waits until each remediation created by the run has a corresponding PASS verification record, the finding and remediation are in VERIFIED or CLOSED state, and the verifier differs from the remediation owner. Customer attestation or a workflow input claiming PASS cannot mark work VERIFIED. FAIL and INCONCLUSIVE results do not advance the workflow.

## Idempotency

External workflow starts require `Idempotency-Key`. Database uniqueness on `(organization_id, idempotency_key)` prevents duplicate runs. FDE execution uses a deterministic run/step idempotency key. Findings, reports and remediation records use workflow-derived idempotency keys. Evidence requests use a deterministic workflow-derived ID and are created before the worker waits.

## Failure handling

Transient gateway failures, 429 responses, 5xx responses and timeouts can retry according to the pinned step policy with bounded exponential backoff. Validation, authorization and policy failures are not retried automatically. Operators can pause, resume, retry a failed run, or cancel it through RBAC-protected controls. A worker finishing after pause/cancel cannot resurrect the run.

## Tenant isolation

Every run, step, approval, artifact and event is bound to an organization. Project ownership is verified server-side before a run starts. Evidence is additionally bound to the run's project and assessment. Read/control endpoints filter by the authenticated organization. Global operators use Better Auth global roles for the internal control plane; no second authorization system exists.

## Provenance and audit

The execution chain is preserved as:

`organization → project → assessment → workflow run → workflow version → step → capability/version → artifact → finding/report/remediation`

FDE results are hashed and stored as workflow artifacts. AI-assisted findings are explicitly marked as such in the M3 workspace model. Evidence request/submission, finding generation, report drafting/approval/publication, remediation creation, project state changes, verification wait states, reassessment scheduling, retries, pauses, cancellations and completion are recorded in the workflow event stream and canonical `AuditEvent` ledger.

## Scheduling

Schedules are persisted with interval, timezone, next-run and provenance fields. The current playbook schedules a 90-day reassessment after successful closure. Duplicate scheduled runs are prevented through the same tenant/idempotency constraints used for manual starts.

## Security baseline

M4 follows the project security baseline and current external guidance. OWASP ASVS 5.0.0 is the application verification baseline. OWASP's 2026 Agentic Applications guidance is applied to excessive agency, tool misuse and identity/privilege boundaries. NIST AI RMF and its Generative AI Profile inform AI provenance, risk management and evaluation. See the CI security gates for static scanning, dependency audit, container scanning, SBOM and AI security regression.

## Operational questions answered

The workflow API exposes run state, pinned playbook version, step history, approvals, artifacts, events, request ID and errors. Operators can therefore determine who/what started a run, its tenant, workflow version, executed steps, FDE capability, failures/retries, approval decisions and resulting artifacts.

## Deliberate scope boundary

M4 does not introduce a second queue, CRM, auth system, notification platform, or autonomous agent runtime. The first playbook only automates capabilities already available through FDE Mastery. New playbooks must be versioned and must pass workflow validation/security tests before activation.
