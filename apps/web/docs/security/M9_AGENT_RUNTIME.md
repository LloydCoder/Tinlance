# M9 — Tinlance Agent Runtime

M9 is the execution plane for controlled, identity-bound agents. It reuses the existing M6 `McpAgent` identity and `McpApproval` approval primitives, calls M7 before consequential actions, uses M6's tool registry/policy/data boundary for MCP operations, and emits durable runtime state and audit evidence that M8 can evaluate.

## Security boundary

```text
Human / API / workflow
        ↓
M9 Agent Runtime
        ↓
M7 Security Gateway
        ↓
M6 MCP policy + tool boundary
        ↓
M5 / Tinlance domain services
```

M9 is not an authorization authority. Model output, memory and tool output are untrusted. M7 remains authoritative for security decisions; M6 remains authoritative for MCP tools.

## Identity and lifecycle

Every M9 agent is an existing tenant-scoped `McpAgent` with runtime enablement and an immutable `AgentVersion`. Agent versions contain instructions, model metadata, capability grants, memory policy, execution budget and risk policy. Running executions reference one version and cannot acquire later permissions silently.

Lifecycle:

`DRAFT → ACTIVE → PAUSED → REVOKED → ARCHIVED`

New executions are rejected unless the agent is active, runtime-enabled and unexpired. Pausing/revoking blocks active queued/waiting executions; privileged continuation must re-check identity and policy.

## Capabilities

Capabilities are explicit tuples of tool, action and optional resource/project/environment/classification/expiry constraints. Default is deny. Model-generated tool names and arguments are validated against the M6 registry and the immutable agent version before execution.

## Runtime loop

The runtime constructs explicit provenance boundaries for system/runtime instructions, agent instructions, user task, memory, policy metadata and execution state. It accepts only two model response types: final response or structured tool call. Tool calls are schema-validated, capability-checked, cycle-checked, budget-checked and passed through M7 before M6 execution.

No shell, arbitrary filesystem, arbitrary database or arbitrary HTTP capability is exposed by default.

## Approvals

M9 reuses `McpApproval`. Approval is bound to the organization, agent, agent version, tool, tool version, resource and parameter digest. Approval is time-limited, single-use and human-bound. Self-approval is rejected. M7 is re-evaluated before the action is executed.

## Memory

Memory is tenant-scoped data. Scope, classification, trust and provenance are persisted. Memory never grants authority. Credential-shaped memory is rejected, and retrieved memory is explicitly marked untrusted/contextual before entering model context.

Retention is policy-driven through `expiresAt`; deleted records remain auditable through the existing audit architecture without becoming authorization inputs.

## Durable execution

`AgentExecution` persists status, immutable version, budget, usage, correlation IDs, waiting approval and bounded error state. Idempotency is unique per organization/agent. Execution controls support run/resume/cancel. The runtime has hard wall-clock, turn, tool, retry, token, cost, output, external-request and depth budgets plus repeated-tool-call cycle protection.

For long-running deployments, an external worker may call the authenticated execution control endpoint. The durable database state is authoritative across process restarts.

## Observability

Every execution has `requestId`, `traceId`, agent/version identity and durable execution steps. Each consequential tool step records M7 decision/policy metadata, hashes rather than raw sensitive payloads, approval references and outcome. Existing `AuditEvent` remains the durable audit ledger.

## Model providers

The runtime has a provider-neutral `ModelAdapter`, a deterministic CI adapter and an HTTPS-only allowlisted HTTP provider adapter. Provider credentials are server-side configuration and are never placed in agent memory or ordinary traces.

## FDE boundary

M9 does not call FDE internals. FDE work remains behind the established Tinlance/FDE API boundary and the canonical `POST /v1/triage/{client_id}/{domain}` contract in `fde-mastery`.

## Assurance

M8 evaluates M9 security invariants including identity, tenant isolation, unauthorized tools, approval bypass, memory poisoning, budget exhaustion, cycles, cancellation, secret leakage and M7 invariance. Critical/high failures are intended to block release.

## Standards basis

The implementation threat model uses OWASP Top 10 for Agentic Applications 2026, the September 2026 OWASP Agent Control Standard, NIST AI RMF/Generative AI Profile and the July 2026 MCP Tasks model. These are control-design references, not certification claims.

## Disabled by default capabilities

M9 does not introduce unrestricted shell, code execution, arbitrary HTTP, unrestricted filesystem, direct Prisma business mutations, automatic internet access, or autonomous red-team execution. Such capabilities remain outside the runtime until an isolated, separately governed boundary exists.
