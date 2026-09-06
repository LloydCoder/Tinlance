# FDE Integration

## Trust boundary

```text
Tinlance Next.js
      │
      │ server-only FDE_SERVICE_TOKEN
      ▼
Tinlance FDE API
      │
      │ OAuth 2.0 client credentials in production
      ▼
fde-mastery gateway
      │
      ▼
/v1/triage/{tenant_id}/{domain}
```

The browser never calls `fde-mastery` directly.

## Tinlance → FDE API contract

The current Tinlance FDE API exposes:

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

The FDE API validates the domain, authenticates the Tinlance caller and propagates the tenant and correlation identifiers.

## FDE API → fde-mastery contract

The gateway translates the server-side request to:

```http
POST {FDE_MASTER_UPSTREAM_URL}/v1/triage/{tenant_id}/{domain}
Authorization: Bearer <upstream credential>
x-request-id: <correlation id>
Idempotency-Key: <operation key>
```

The upstream tenant/client identifier is therefore derived from the authenticated Tinlance organization context. It is never trusted from browser-controlled data.

## Supported domains

The current gateway allowlist is:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

Unknown domains are rejected.

## Authentication

### Tinlance → FDE API

The FDE API requires the server-only `FDE_SERVICE_TOKEN`. End users never authenticate directly to this service boundary.

### FDE API → fde-mastery

Production uses OAuth 2.0 client credentials when the OAuth configuration is present. The static upstream token fallback is restricted to development/test by the gateway.

## M3 execution

The M3 customer workspace invokes the Tinlance FDE API from a server-side route after resolving:

1. Better Auth session.
2. Active organization membership.
3. Project ownership.
4. Assessment ownership.
5. Supported execution domain.
6. FDE service configuration.

The assessment result is persisted in the workspace with its request correlation ID and SHA-256 result hash. Upstream failures never become successful assessment results.

## Resilience and safety

The gateway provides bounded input validation, domain allowlisting, timeout controls, request correlation, idempotency and safe upstream error handling. Production readiness fails closed when upstream authentication is unavailable.

## Verification status

Source-level gateway contract tests are part of CI. A live Tinlance → FDE API → `fde-mastery` execution remains a deployment acceptance test and must be observed before being certified as live.

**LIVE FDE PATH: UNVERIFIED** until authenticated production execution is observed.

## Security baseline

Changes must preserve least privilege, domain allowlisting, tenant isolation, authenticated service-to-service communication, request correlation, safe error handling, timeout enforcement and auditability. The boundary is reviewed against OWASP ASVS 5.0 and current AI/agent security guidance.
