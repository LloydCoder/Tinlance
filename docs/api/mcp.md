# Tinlance MCP Gateway

Status: production implementation target for M6. The gateway is a controlled interface over Tinlance Core; it is not a database API and does not execute FDE Mastery code directly.

## Protocol

Tinlance uses the official `@modelcontextprotocol/server` v2 SDK and targets MCP protocol revision `2026-07-28`. The HTTP endpoint is `/mcp` and uses the modern stateless Streamable HTTP model. Legacy session-oriented MCP behavior is rejected.

The gateway keeps protocol state out of the application. Customer state, approvals, agent identities and workflow state are persisted in Tinlance application storage and are independently authorized.

MCP `tools/list` responses are private and have a zero-second cache hint because tool visibility is authorization-sensitive. Tool discovery is filtered by the authenticated agent's current grant set and token scopes; every invocation repeats server-side authorization.

## Trust chain

```text
Human / Agent
  -> authenticated credential
  -> organization
  -> agent identity
  -> tool grant + scope
  -> current Better Auth membership permissions
  -> MCP policy / risk
  -> human approval where required
  -> Tinlance Core / durable automation
  -> result filtering
  -> AuditEvent
```

The organization and user identity are never taken from tool arguments.

## Authentication

The resource server accepts:

1. Managed Tinlance MCP agent credentials (`tl_mcp_...`), which are generated once, stored only as SHA-256 hashes, expire within 90 days, and can be revoked immediately.
2. External OAuth/OIDC access tokens when `MCP_OAUTH_ISSUER`, `MCP_OAUTH_AUDIENCE`, and `MCP_OAUTH_JWKS_URL` are configured. The verifier requires HTTPS issuer/JWKS configuration, RS256, `iss`, `aud`, `exp`, optional `nbf`, a trusted `kid`, a valid signature, and an agent identity binding.

Tinlance is a resource server in the external OAuth case; it does not implement a second authorization server. The MCP SDK bearer gate returns standards-based bearer challenges and enforces the endpoint-level `mcp:read` scope.

Managed credentials are intended for controlled service/agent integrations. Enterprise deployments should prefer short-lived OAuth access tokens and sender-constrained credentials (for example DPoP) where their authorization provider supports them.

## Agent identity

Every managed agent has:

- organization
- owner user
- client/application identity
- status and revocation state
- environment
- scopes
- explicit tool grants
- expiry
- last-use timestamp

Agent grants are stored separately from M5 API credentials. The authenticated agent is revalidated against its organization and owner membership on every invocation.

## Tool registry

Production tools are statically registered in `apps/web/lib/mcp/registry.ts`. There is no arbitrary production tool registration API.

Current enabled customer tools:

| Tool | Risk | Required scopes | Approval |
|---|---|---|---|
| `tinlance.projects.list` | READ | `mcp:read`, `projects:read` | No |
| `tinlance.projects.get` | READ | `mcp:read`, `projects:read` | No |
| `tinlance.assessments.get` | READ | `mcp:read`, `assessments:read` | No |
| `tinlance.findings.list` | READ | `mcp:read`, `findings:read` | No |
| `tinlance.reports.get` | READ | `mcp:read`, `reports:read` | No |
| `tinlance.remediation.list` | READ | `mcp:read`, `remediation:read` | No |
| `tinlance.assessments.execute` | ANALYZE | `mcp:write`, `assessments:execute` | **Yes** |

No public/customer MCP tool provides direct SQL, shell execution, arbitrary HTTP fetching, provider credentials, deployment control, permission administration or destructive deletion.

## Authorization and tenant isolation

Authorization is centralized in `apps/web/lib/mcp/policy.ts` and is layered with existing Tinlance workspace RBAC. A tool must pass all of:

- active agent status
- organization/agent identity binding
- explicit tool grant
- required scopes
- environment policy
- current Better Auth organization membership
- required workspace permission
- risk/approval policy

Every customer query includes the authenticated organization ID server-side. Resource IDs are never sufficient for authorization.

Cross-tenant resources return the same safe `NOT_FOUND` shape as genuinely absent resources.

## Human approval

`tinlance.assessments.execute` requires an approval record. The approval is bound to organization, agent, requester, tool ID/version, target resource and a SHA-256 digest of the exact action parameters.

Approvals expire after 15 minutes, cannot be self-approved, and are atomically consumed before execution. A changed parameter set cannot reuse the approval.

Approval records and decisions are written to the existing `AuditEvent` ledger.

## FDE integration

The MCP layer never calls FDE Mastery directly. Assessment execution enters Tinlance's durable M4 automation boundary. The existing FDE gateway remains responsible for the canonical upstream FDE Mastery trust boundary, including the established `/v1/triage/{client_id}/{domain}` contract, tenant propagation, upstream authentication, correlation and error normalization.

## Input/output safety

Tool inputs use strict Zod schemas and the MCP SDK converts them to protocol JSON Schema. Request bodies are bounded to 512 KiB at the gateway and tool results to 512 KiB.

MCP output exposes customer-safe DTOs rather than raw database records. Findings are restricted to customer-visible classifications and reports are limited to approved/published/superseded states.

The gateway never interprets tool descriptions or retrieved content as authorization instructions. Prompt injection and indirect injection therefore cannot grant permissions that the server-side policy engine has not granted.

## Rate limits and reliability

MCP uses Tinlance's existing rate-limiting infrastructure with agent/tool-specific keys. Read, write and expensive operations use the same shared rate classes as the M5 API platform. Expensive assessment execution is bounded and enters the durable workflow engine instead of blocking the MCP request.

Mutating/expensive execution requires an idempotency key. The durable workflow engine remains the canonical execution system.

## Audit

Security-sensitive MCP events use the existing `AuditEvent` ledger. Recorded metadata includes request ID, organization, agent, client, tool/version, action, authorization decision, policy decision, risk, classifications, parameter digest, outcome, error code and duration where available.

Access tokens, API keys, passwords, approval secrets and raw customer evidence are not logged.

## Revocation

Agents can be revoked from the Tinlance API control plane. Revocation is checked at authentication time, so a revoked credential cannot establish a new MCP request.

## Versioning

- MCP protocol: `2026-07-28`
- Tinlance MCP gateway: `1.0.0`
- Tool contracts: independently versioned per registry entry

The MCP SDK's 2026 protocol deprecation policy is followed; legacy protocol/session behavior is not silently accepted.

## Production configuration

For external OAuth/OIDC, configure:

- `MCP_OAUTH_ISSUER=https://...`
- `MCP_OAUTH_AUDIENCE=...`
- `MCP_OAUTH_JWKS_URL=https://...`
- `MCP_RESOURCE_METADATA_URL=https://...`

For browser-capable clients, configure explicit comma-separated `MCP_ALLOWED_ORIGINS`; do not use a wildcard.

Managed agent credentials are created through the authenticated `/api/v1/mcp/agents` control plane and the secret is displayed only at creation time.
