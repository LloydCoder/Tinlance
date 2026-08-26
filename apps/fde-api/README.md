# Tinlance FDE API

Authenticated service boundary between the Tinlance web application and the separate `fde-mastery` execution platform.

## Current contract

```http
POST /v1/execute
Authorization: Bearer <Tinlance-service-credential>
Idempotency-Key: <unique-key>
X-Request-ID: <optional-UUID>
```

Request:

- `task`: required string, 1–20,000 characters.
- `domain`: required supported execution domain.
- `organization_id`: required FDE Mastery client/tenant identifier. It must match the lowercase `[a-z0-9-]` client-id contract used by the engine.
- `metadata`: bounded string-to-string metadata map.

The gateway maps this stable Tinlance contract to the canonical FDE Mastery v1 route:

```http
POST /v1/triage/{organization_id}/{domain}
Authorization: Bearer <FDE-Mastery credential>
Idempotency-Key: <same-key>
X-Request-ID: <same-request-id>
```

The gateway does not invent a second engine execution protocol and does not send a global tenant identifier. The organization identifier is the tenant/client boundary for the engine call.

Supported domains mirror the FDE Mastery domain enum:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`
- `procurement`
- `custom`

Operational endpoints:

- `GET /health` — liveness only.
- `GET /ready` — configuration readiness.
- `POST /v1/execute` — authenticated execution gateway.

Interactive API documentation is disabled by default. Set `FDE_ENABLE_DOCS=true` only in controlled environments where exposure is intentional.

## Trust boundaries

```text
Tinlance application
       │
       │ authenticated service credential
       ▼
   FDE API
       │
       │ OAuth 2.0 client credentials or controlled dev token
       ▼
  fde-mastery /v1/triage/{organization_id}/{domain}
```

The FDE API does not authenticate end users. The Tinlance application is responsible for authenticating the user and enforcing organization membership before invoking this service. The gateway then authenticates the upstream call separately.

FDE Mastery remains authoritative for client registration, domain enablement, tenant authorization, policy decisions, idempotency and execution/audit semantics. The Tinlance gateway must not auto-provision an FDE Mastery client as a side effect of an execution request.

## Security controls

- Constant-time service-token comparison.
- Explicit supported-domain allowlist aligned with FDE Mastery.
- Pydantic request validation with unknown fields rejected.
- Bounded task, domain, organization and metadata inputs.
- Required idempotency keys for execution requests.
- UUID validation for propagated request IDs; malformed IDs are replaced with a fresh correlation ID.
- Trusted-host validation through `FDE_ALLOWED_HOSTS`.
- Upstream OAuth 2.0 client-credentials support with expiry-aware token caching.
- Static upstream token supported only as a controlled fallback for development/transition environments.
- Provider/upstream secrets remain server-side.
- Generic upstream error responses prevent secret leakage.
- Separate liveness and readiness endpoints.
- No plaintext provider credentials or client secrets are returned to callers.

## Production configuration

Set `FDE_ALLOWED_HOSTS` to the exact API hostname(s) accepted by the deployment. The default is intentionally local-only (`localhost,127.0.0.1`) so a production deployment fails closed unless its host policy is configured.

The production path should use OAuth 2.0 client credentials for `fde-mastery`; `FDE_MASTER_UPSTREAM_TOKEN` is retained only for controlled development or migration scenarios.

Before an organization can execute, its corresponding FDE Mastery client must be provisioned through the engine's controlled onboarding/admin path with the required domain set. Execution must never create that registration implicitly.

## Testing

Run from `apps/fde-api`:

```bash
pip install -e '.[test]'
pytest -q
ruff check .
python -m pip check
```

The API is not considered production-ready solely because its unit tests pass. The Tinlance → FDE API → FDE Mastery path still requires deployment-level authentication, organization/client provisioning, tenancy, idempotency, timeout, correlation and failure-path verification.
