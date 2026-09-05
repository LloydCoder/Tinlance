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
fde-mastery
      │
      ▼
AgentRouter / domain agents
```

## Execution contract

The gateway exposes the same versioned route shape expected by the current `fde-mastery` integration contract:

```http
POST /v1/{domain}/execute
Authorization: Bearer <Tinlance service credential>
Idempotency-Key: <unique operation key>
x-request-id: <UUID, optional>

{
  "tenant_id": "org-slug-or-id",
  "payload": { ... }
}
```

The gateway forwards the upstream envelope unchanged in meaning:

```http
POST {FDE_MASTER_UPSTREAM_URL}/v1/{domain}/execute
Authorization: Bearer <OAuth access token>
x-request-id: <correlation id>
Idempotency-Key: <operation key>

{
  "tenant_id": "org-slug-or-id",
  "payload": { ... }
}
```

The tenant identifier is trusted only across the authenticated server-to-server boundary. Browser clients must never receive `FDE_SERVICE_TOKEN` or call the gateway directly.

## Supported domains

The gateway explicitly accepts:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`

Unknown domains are rejected at the gateway instead of being passed blindly to the upstream service.

## Authentication boundaries

There are two distinct trust relationships:

### Tinlance → FDE API

This is the internal service boundary. The gateway rejects unauthenticated requests and requires the server-only `FDE_SERVICE_TOKEN`.

### FDE API → fde-mastery

Production uses OAuth 2.0 client credentials. The access token is cached and refreshed before expiry. A static upstream token is accepted only when `FDE_ENV=development` or `FDE_ENV=test`; it is not a production authentication mechanism.

## Tenant propagation

The gateway requires explicit tenant context and validates its syntax before forwarding execution. The authoritative tenant identity must originate from the authenticated Tinlance server-side organization context. The gateway does not accept tenant identity from browser code.

The current `fde-mastery` service independently enforces tenant authorization from the authenticated upstream principal and the forwarded `tenant_id`.

## Resilience

The gateway provides:

- request timeouts;
- explicit upstream authentication failures;
- readiness checks that distinguish process liveness from service readiness;
- request correlation;
- safe error responses; and
- tests for token caching and upstream request construction.

The failure path must never convert an upstream outage into a false successful execution response.

## Readiness

Production readiness requires:

- `FDE_SERVICE_TOKEN`;
- `FDE_MASTER_UPSTREAM_URL`; and
- complete OAuth client-credentials configuration.

Development/test may use the static upstream token fallback explicitly. Production readiness must fail closed when only the fallback is configured.

## Testing requirements

The integration test suite covers, at minimum:

- authentication requirements;
- missing upstream configuration;
- production rejection of static upstream authentication;
- unsupported domains;
- canonical upstream URL construction;
- exact upstream request envelope;
- tenant propagation;
- authorization header propagation;
- OAuth token retrieval;
- OAuth token caching; and
- repeated executions reusing a valid cached token.

Production acceptance additionally requires an actual authenticated Tinlance → FDE API → `fde-mastery` execution and a verified response path back to Tinlance.

**LIVE FDE PATH: UNVERIFIED** until that end-to-end execution is observed in the deployed environment.

## Operational environment

Production deployment must provide the upstream URL and corresponding service/OAuth configuration through the secret manager/environment. Secrets must not be committed to Git or exposed to browser code.

## Security requirements

The FDE API is a high-value trust boundary. Changes must preserve:

- least privilege;
- explicit domain allowlisting;
- tenant isolation;
- authenticated service-to-service communication;
- request correlation;
- safe error handling;
- timeout enforcement; and
- auditability.

The boundary is reviewed against OWASP ASVS 5.0 and AI/agent security controls appropriate to tool-using execution systems.
