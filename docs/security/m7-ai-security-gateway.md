# M7 — Tinlance AI Security Gateway

M7 is the cross-cutting security control plane beneath M5 API and M6 MCP execution. It does not replace Better Auth, workspace authorization, M4 business logic, or the existing AuditEvent ledger.

## Decision path

`identity → tenant → principal → permission → policy → risk → approval/step-up → rate/resource controls → execution → output filtering → audit`

The security gateway uses the existing Better Auth organization/session model and existing workspace permissions. API authentication now records and evaluates an M7 decision before returning an API principal. M6 MCP execution now passes through M7 before the existing M6 permission/tool/approval checks.

## Principal types

M7 distinguishes `HUMAN`, `SERVICE`, `API_CLIENT`, `MCP_CLIENT`, `AI_AGENT`, `WORKFLOW`, `EXTERNAL_INTEGRATION`, and `SYSTEM`. AI-agent requests retain the owner/delegating user and client identifiers already resolved by M6.

## Policy

The initial policy is a versioned, database-backed default policy (`tinlance-default-security-policy`, version `1`). Policy failure is deny. High and critical risk actions require approval; high and critical actions also require step-up after approval. The persisted control plane includes policy, policy version, approval, and revocation records.

## Risk

Risk is deterministic and bounded to `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL`. It considers operation impact, destructive semantics, HTTP method/path, and data classification. Risk can never create a permission that does not already exist.

## Tenant isolation

The organization/tenant comes from trusted authenticated context. M5 continues to scope queries by `organizationId`; M6 resolves the organization from the authenticated MCP agent. M7 rejects explicit tenant-context mismatches and persisted principal revocation.

## AI security boundary

Prompts, documents, retrieved content, tool descriptions, MCP metadata and tool output are untrusted data. They cannot modify M7 policy, permissions, tenant identity, approval state, or revocation state. Model output is never an authorization decision.

MCP tool descriptions are sanitized only for presentation/output concerns; authorization is independent of tool descriptions and annotations.

## Output security

MCP responses pass through the M7 output sanitizer before serialization. Obvious bearer tokens, API-key/secret/token/password fields and matching secret patterns are redacted. Sensitive payloads should not be placed in audit metadata; parameter hashes should be used for exact-action correlation.

## Emergency controls

The gateway supports strongly scoped operational environment controls:

- `TINLANCE_SECURITY_GATEWAY_DENY_ALL=true`
- `TINLANCE_SECURITY_GATEWAY_DENY_AGENTS=true`
- `TINLANCE_SECURITY_GATEWAY_DENY_ORGANIZATIONS=org-a,org-b`
- `TINLANCE_SECURITY_GATEWAY_DISABLED_TOOLS=tool-a,tool-b`

These controls are fail-closed and security decisions are audited.

## Failure behavior

If the policy record is unavailable, or a principal is revoked, sensitive authorization fails closed. Existing rate limiting remains in force and is not replaced by M7.

## Existing M0–M6 boundaries retained

- Better Auth remains the identity authority.
- Workspace authorization remains the canonical existing permission catalogue.
- M3 remains the customer workspace/domain service layer.
- M4 remains workflow/business logic and FDE execution orchestration.
- M5 remains the public API contract.
- M6 remains the MCP protocol/tool gateway.
- FDE Mastery remains behind the existing FDE API trust boundary.

M7 is the security decision layer, not a business-logic replacement.
