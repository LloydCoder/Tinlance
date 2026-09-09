# M7 Threat Model

| Threat | Control | Test | Telemetry | Residual risk |
|---|---|---|---|---|
| Cross-tenant access | Trusted organization context + server-side resource scoping + M7 tenant mismatch denial | Tenant A → Tenant B read/write tests | `M7_DENY`, tenant mismatch metadata | Service/query defects must still be covered by regression tests |
| Agent privilege escalation | Separate agent identity, owner/client binding, M6 grants, workspace permission checks, M7 risk gate | Excess scope/tool/permission tests | Agent ID, client ID, policy decision | Compromised owner identity remains a high-impact threat |
| Prompt/indirect injection | Model content is untrusted and never changes policy/permissions | Malicious prompt/document/tool-output corpus | M7 action/decision events | Detection of malicious content is not itself authorization |
| Tool poisoning | Tool registry and required permissions are authoritative; descriptions are non-authoritative | Poisoned tool metadata test | Tool ID + policy decision | Trusted server compromise remains residual risk |
| Confused deputy | M6 verifies audience/issuer/agent binding and does not pass client bearer credentials downstream | Wrong audience/issuer/client tests | Authentication failures | External provider configuration remains operational risk |
| Approval bypass/replay | Exact parameter hash, resource/tool binding, expiration and atomic consumption in M6; M7 approval records | Changed-resource, changed-parameter, replay, race tests | Approval IDs and hashes | Approval UX/identity assurance must remain strong |
| Policy failure | Persisted active-policy check fails closed | Remove/disable policy test | `POLICY_UNAVAILABLE` | Availability impact is intentional for sensitive actions |
| Credential revocation race | M6 credential status plus M7 revocation lookup at execution boundary | Revoke-before-call and concurrent revoke tests | Revocation events | Already-running external side effects cannot always be rolled back |
| Data exfiltration | Tenant authorization, output sanitization, scoped integrations, no agent DB access | Secret/output/cross-tenant tests | Classification and output metadata | Destination-specific DLP needs future provider-specific controls |
| Audit tampering | Existing AuditEvent is reused; M7 adds structured decision metadata | Ordinary-user audit mutation tests | Audit events | Strong WORM/cryptographic anchoring is deployment-dependent |
| Resource exhaustion | Existing rate limiter + M6 per-agent/tool limits + bounded MCP request/results | Rate/loop/large-result tests | Rate-limit events | Provider-side quotas remain external dependencies |
| SSRF | Existing integration boundaries; M7 does not permit arbitrary destinations | URL/redirect tests at integration boundaries | Blocked integration events | Each external integration must retain destination validation |

## Assets

Tenant data, customer evidence, security findings, reports, remediation state, credentials, agent permissions, policies, audit history, billing operations, FDE execution and external integrations.

## Actors

Anonymous attacker, authenticated customer, malicious customer user, compromised user, malicious/compromised AI agent, MCP client, malicious tool, malicious integration, internal operator, compromised service and external attacker.
