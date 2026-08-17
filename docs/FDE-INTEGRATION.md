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

The gateway exposes the versioned execution shape:

```http
POST /v1/{domain}/execute
```

The execution payload carries tenant-aware context, including task payload, organization context, and metadata. Request IDs are propagated so one operation can be correlated across Tinlance, the gateway, and the upstream execution platform.

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

This is the internal service boundary. The gateway must not accept an unauthenticated public execution request.

### FDE API → fde-mastery

The gateway supports OAuth 2.0 client credentials for upstream authentication. Configuration includes the upstream token endpoint, client ID, client secret, and optional audience. Access tokens are cached and refreshed before expiry rather than requesting a new token for every execution.

A static-token fallback is intended for development compatibility only and must not silently replace production OAuth configuration.

## Tenant propagation

The gateway requires explicit tenant context and validates it before forwarding execution. Organization/task/metadata context is propagated upstream so the execution layer can enforce tenant-aware policy.

A client must not be able to bypass authorization by supplying an arbitrary organization identifier. The authoritative tenant identity comes from the authenticated Tinlance request context.

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

Readiness checks validate the configuration required to serve execution traffic, including upstream configuration, tenant configuration, and required authentication material. Liveness and readiness are separate operational concepts.

## Testing requirements

The integration test suite covers, at minimum:

- authentication requirements;
- missing upstream configuration;
- unsupported domains;
- upstream URL construction;
- upstream request shape;
- tenant propagation;
- authorization header propagation;
- OAuth token retrieval;
- OAuth token caching; and
- repeated executions reusing a valid cached token.

Production acceptance additionally requires an actual authenticated Tinlance → FDE API → `fde-mastery` execution and a verified response path back to Tinlance.

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
