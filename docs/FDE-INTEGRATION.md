# FDE Integration

## Trust boundary

```text
Tinlance Next.js
      │
      │ server-only FDE_SERVICE_TOKEN
      ▼
Tinlance FDE API gateway
      │
      │ OAuth 2.0 client credentials in production
      ▼
fde-mastery platform-core
      │
      ▼
POST /v1/triage/{client_id}/{domain}
```

The browser never calls `fde-mastery` directly.

## Tinlance → FDE API contract

```http
POST /v1/{domain}/execute
Authorization: Bearer <FDE_SERVICE_TOKEN>
Idempotency-Key: <unique operation key>
x-request-id: <UUID>

{
  "tenant_id": "org-id-or-slug",
  "payload": { ... }
}
```

This is the Tinlance gateway interface only. It is intentionally different from the upstream contract.

## FDE API → fde-mastery contract

The canonical upstream production contract is:

```http
POST /v1/triage/{client_id}/{domain}
Authorization: Bearer <OAuth access token>
Idempotency-Key: <unique operation key>
x-request-id: <UUID>

{ ...validated triage payload... }
```

The gateway propagates the tenant/client identifier as the path parameter, preserves correlation and idempotency headers, and forwards the validated workspace payload. It does not wrap the payload in a competing execution envelope.

The `fde-mastery` v1 facade reuses its established triage implementation; it is not a second execution engine.

## Supported domains

The current Tinlance gateway allowlist is:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

The canonical `fde-mastery` `Domain` enum is the source of truth for the upstream domain taxonomy. Unknown domains are rejected at the gateway.

## Authentication

### Tinlance → FDE API

The FDE API requires the server-only `FDE_SERVICE_TOKEN`. End users never authenticate directly to this service boundary.

### FDE API → fde-mastery

Production uses OAuth 2.0 client credentials when configured. Static upstream tokens are restricted to development/test by the gateway. The upstream platform applies its own tenant-aware authorization and scope checks.

## M3/M4 execution

M3 and M4 server-side execution resolves:

1. Better Auth session.
2. Active organization membership or authorized internal operator.
3. Project ownership.
4. Assessment ownership for customer assessment workflows.
5. Supported execution domain/capability.
6. FDE service configuration.

M4 additionally propagates workflow run ID, workflow step ID, request ID and pinned capability metadata as validated payload context. Results are stored with provenance and SHA-256 hashes before they feed M3 findings/reports/remediation.

## Resilience and safety

The gateway provides bounded input validation, domain allowlisting, timeout controls, request correlation, required idempotency and safe upstream error handling. Production readiness fails closed when upstream authentication is unavailable.

M4 adds persisted workflow leases, bounded retries, retry scheduling, approval gates and operator controls without introducing a second authorization or execution system.

## Verification status

Source-level gateway contract tests cover every supported domain and assert the canonical `/v1/triage/{client_id}/{domain}` route. A live authenticated Tinlance → FDE API → `fde-mastery` execution remains a deployment acceptance test and must be observed before it is certified as live.

**LIVE FDE PATH: UNVERIFIED** until authenticated production execution is observed.

## Security baseline

Changes preserve least privilege, domain allowlisting, tenant isolation, authenticated service-to-service communication, request correlation, safe error handling, timeout enforcement and auditability. The boundary is reviewed against OWASP ASVS 5.0 and current AI/agent security guidance.
