# FDE Integration

## Purpose

`apps/fde-api` is Tinlance's authenticated Python service boundary for execution against the separate `fde-mastery` platform. Tinlance and `fde-mastery` remain independently deployable systems.

```text
Tinlance Next.js
      │
      ▼
Tinlance FDE API
      │
      │ OAuth 2.0 client credentials
      ▼
fde-mastery v1 gateway
      │
      ▼
Agent runtime / domain workflows
```

## Current execution contract

The current gateway code exposes:

```http
POST /v1/{domain}/execute
Authorization: Bearer <Tinlance service credential>
Idempotency-Key: <unique operation key>
x-request-id: <optional UUID>

{
  "tenant_id": "org-slug-or-id",
  "payload": { ... }
}
```

The gateway validates the domain against the canonical eight-domain FDE Mastery contract and translates the request to:

```http
POST {FDE_MASTER_UPSTREAM_URL}/v1/triage/{tenant_id}/{domain}
Authorization: Bearer <upstream credential>
x-request-id: <correlation id>
Idempotency-Key: <operation key>
```

The gateway keeps the Tinlance boundary stable while preserving the upstream contract. It does not auto-provision FDE Mastery clients as a side effect of execution.

## Supported domains

The gateway currently accepts:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

This list is reconciled against the current `fde-mastery` README and Tinlance gateway source. Unknown domains are rejected.

## Authentication boundaries

### Tinlance → FDE API

The FDE API requires the server-only `FDE_SERVICE_TOKEN`. End users do not authenticate directly to this service boundary.

### FDE API → fde-mastery

Production is designed for OAuth 2.0 client credentials. A static upstream token is supported only in development/test by the current code. Production readiness fails closed when only that fallback is configured.

## Tenant propagation

The Tinlance server establishes the authenticated organization context before invoking the gateway. The gateway validates the tenant/client identifier and forwards it to the upstream path. Browser code is never an authority for tenant identity.

## Resilience and safety

The gateway provides request correlation, idempotency-key requirements, bounded inputs, timeout controls, safe upstream error handling and readiness checks. An upstream failure must not be translated into a false successful execution.

## Verification status

Source-level contract tests and CI validate the gateway boundary. A live deployed Tinlance → FDE API → `fde-mastery` execution remains a deployment acceptance test and must not be inferred solely from source presence.

**LIVE FDE PATH: UNVERIFIED** until an authenticated end-to-end execution is observed in the deployed environment.

## Security requirements

Changes must preserve least privilege, domain allowlisting, tenant isolation, authenticated service-to-service communication, request correlation, safe error handling, timeout enforcement and auditability. The boundary is reviewed against OWASP ASVS 5.0 and current AI/agent security guidance.
