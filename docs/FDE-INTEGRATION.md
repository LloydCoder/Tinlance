# FDE Integration

## Purpose

`apps/fde-api` is Tinlance's authenticated Python service boundary for execution against the separate `fde-mastery` platform. Tinlance and `fde-mastery` remain independently deployable systems.

```text
Tinlance Next.js
      │
      ▼
Tinlance FDE API
      │
      │ OAuth 2.0 client credentials / API key compatibility
      ▼
fde-mastery v1 gateway
      │
      ▼
AgentRouter / domain agents
```

## Execution contract

Tinlance exposes a stable internal execution route and translates it to the canonical `fde-mastery` v1 triage route:

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

The gateway calls the canonical `fde-mastery` route:

```http
POST {FDE_MASTER_UPSTREAM_URL}/v1/triage/{client_id}/{domain}
Authorization: Bearer <OAuth access token or configured API key>
x-request-id: <correlation id>
Idempotency-Key: <operation key>

{ ...payload }
```

`tenant_id` is mapped to the upstream `client_id` path segment. The inner `payload` object is forwarded as the upstream request body. This translation is intentional and keeps the Tinlance boundary stable while matching the authoritative `fde-mastery` contract.

The `fde-mastery` v1 response is returned inside the Tinlance gateway's `result` field together with the gateway request ID and upstream status.

## Supported domains

The gateway explicitly accepts the canonical eight domains:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

Unknown domains are rejected at the Tinlance gateway instead of being passed blindly upstream.

## Authentication boundaries

There are two distinct trust relationships:

### Tinlance → FDE API

This is the internal service boundary. The gateway rejects unauthenticated requests and requires the server-only `FDE_SERVICE_TOKEN`.

### FDE API → fde-mastery

Production uses OAuth 2.0 client credentials when the upstream OIDC issuer/audience is configured. The access token is cached and refreshed before expiry. A static upstream token is accepted only when `FDE_ENV=development` or `FDE_ENV=test`; it is not a production authentication mechanism.

`fde-mastery` itself supports either its configured API-key trust boundary or OIDC bearer validation, depending on its production configuration.

## Tenant propagation

The gateway requires explicit tenant context and validates its syntax before forwarding execution. The authoritative tenant identity must originate from the authenticated Tinlance server-side organization context. The gateway does not accept tenant identity from browser code.

The upstream `fde-mastery` triage endpoint binds the tenant/client identity to the authenticated principal when OIDC is enabled and independently checks that the client exists and has the requested domain enabled.

## Resilience

The gateway provides:

- request timeouts;
- explicit upstream authentication failures;
- readiness checks that distinguish process liveness from service readiness;
- request correlation;
- safe error responses; and
- tests for token caching and canonical upstream request construction.

The failure path must never convert an upstream outage into a false successful execution response.

## Readiness

Production readiness requires:

- `FDE_SERVICE_TOKEN`;
- `FDE_MASTER_UPSTREAM_URL`; and
- complete OAuth client-credentials configuration when the upstream is configured for OIDC.

Development/test may use the static upstream token fallback explicitly. Production readiness must fail closed when only the fallback is configured.

## Testing requirements

The integration test suite covers, at minimum:

- authentication requirements;
- missing upstream configuration;
- production rejection of static upstream authentication;
- all eight supported domains;
- unsupported domains;
- canonical `/v1/triage/{client_id}/{domain}` upstream URL construction;
- exact upstream payload translation;
- tenant/client propagation;
- authorization header propagation;
- request correlation;
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
