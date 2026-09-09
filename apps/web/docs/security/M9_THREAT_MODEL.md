# M9 Agent Runtime Threat Model

## Assets

Customer data, agent identity, agent-version configuration, model/provider credentials, MCP credentials, memory, approvals, policy decisions, execution state, audit records, FDE data and external integration access.

## Trust boundaries

1. Authenticated human/API principal → M9 management API.
2. M9 agent identity → M7 security gateway.
3. M9 → M6 MCP policy/tool boundary.
4. M6/M5 → domain services and external systems.
5. Model output → runtime parser.
6. Tool/external content → runtime context.
7. Memory store → model context.
8. M9 runtime → M8 assurance evidence.

## Threat actors

- malicious or compromised tenant user
- malicious agent instructions
- malicious model output
- prompt/goal injection
- compromised MCP server/tool
- poisoned memory/document
- compromised integration
- cross-tenant attacker
- insider with excessive approval rights
- resource-exhaustion attacker

## Primary threats and controls

| Threat | Primary M9 control | Authority |
|---|---|---|
| Agent impersonation | server-resolved identity + immutable version | Better Auth / M9 |
| Tenant escape | organization-bound queries + M7 tenant context | M7 |
| Privilege escalation | explicit capabilities + persisted M6 grants | M7/M6 |
| Tool misuse | schema validation + capability + M7 + M6 | M7/M6 |
| Fake approval | human-bound `McpApproval` | M7/M6/M9 |
| Approval replay/tamper | expiry + parameter/tool/version binding + transactional consume | M6 |
| Memory poisoning | trust/provenance + secret rejection + memory-as-data | M9 |
| Prompt injection | provenance-separated context + untrusted tool/memory content | M9/M8 |
| Tool-output injection | tool output appended as data, never policy | M9 |
| Runaway execution | hard budgets + cycle detection + timeout | M9 |
| Duplicate mutation | idempotency + durable execution state | M9/M4 |
| Revocation race | lifecycle checks + M7 re-evaluation | M7/M9 |
| SSRF | no arbitrary HTTP tool; provider egress allowlist | M9 |
| Secret leakage | server-side provider credential + redaction/hash evidence | M9/M7 |
| Cross-agent escalation | version-scoped capabilities and bounded depth | M9/M8 |
| Audit gaps | existing `AuditEvent` + execution steps | Tinlance |

## OWASP Agentic 2026 coverage

M9 explicitly addresses goal/identity hijacking, tool misuse, excessive agency, memory/context poisoning, insecure inter-agent communication, supply-chain inputs and cascading/runaway failures. The M8 golden corpus contains runtime cases for these classes.

## NIST AI RMF / TEVV

M9 records reproducible agent-version configuration, execution state, policy decisions, tool observations and usage metadata so M8 can provide lifecycle evaluation evidence. The runtime itself does not claim formal NIST compliance.

## OWASP ASVS

Applicable controls cover authentication, authorization, access control, API input validation, sensitive-data handling, logging, error handling, cryptographic hashing of evidence and resource exhaustion. No ASVS certification claim is made.

## Residual risks

- Live model-provider behavior depends on the configured provider and its contract.
- Long-running execution requires a durable worker invocation mechanism; persisted state is ready for worker/resume operation.
- No unrestricted code/shell/computer-use capability is enabled.
- Production deployment verification is pending the Vercel quota reset and is intentionally not bypassed.
