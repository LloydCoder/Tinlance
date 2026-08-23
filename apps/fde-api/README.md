# Tinlance FDE API

Authenticated service boundary between the Tinlance web application and the separate `fde-mastery` execution platform.

## Current contract

```http
POST /v1/execute
```

Request:

- `task`: required string, 1–20,000 characters.
- `domain`: required supported execution domain.
- `organization_id`: optional organization context propagated to the upstream execution service.
- `metadata`: string-to-string metadata map.

Supported domains:

- `cybersecurity`
- `finance`
- `healthtech`
- `logistics`
- `legal`
- `revops`

Operational endpoints:

- `GET /health` — liveness only.
- `GET /ready` — configuration readiness.
- `POST /v1/execute` — authenticated execution gateway.

Interactive API documentation is disabled by default. Set `FDE_ENABLE_DOCS=true` only in controlled environments where exposure is intentional.

## Trust boundaries

```text
Tinlance application
       │
       │ Bearer service credential
       ▼
   FDE API
       │
       │ OAuth 2.0 client credentials or controlled dev token
       ▼
  fde-mastery
```

The FDE API does not authenticate end users. The Tinlance application is responsible for authenticating the user and enforcing organization membership before invoking this service. The gateway then authenticates the upstream call separately.

## Security controls

- Constant-time service-token comparison.
- Explicit supported-domain allowlist.
- Pydantic request validation with unknown fields rejected.
- Bounded task, domain, organization, and metadata inputs.
- UUID validation for propagated request IDs; malformed IDs are replaced with a fresh correlation ID.
- Trusted-host validation through `FDE_ALLOWED_HOSTS`.
- Upstream OAuth 2.0 client-credentials support with expiry-aware token caching.
- Static upstream token supported only as a controlled fallback for development/transition environments.
- Provider/upstream secrets remain server-side.
- Generic upstream error responses prevent secret leakage.
- Separate liveness and readiness endpoints.

## Production configuration

Set `FDE_ALLOWED_HOSTS` to the exact API hostname(s) accepted by the deployment. The default is intentionally local-only (`localhost,127.0.0.1`) so a production deployment fails closed unless its host policy is configured.

The production path should use OAuth 2.0 client credentials for `fde-mastery`; `FDE_MASTER_UPSTREAM_TOKEN` is retained only for controlled development or migration scenarios.

## Testing

Run from `apps/fde-api`:

```bash
pip install -e '.[test]'
pytest -q
ruff check .
python -m pip check
```

The API is not considered production-ready solely because its unit tests pass. The Tinlance → FDE API → `fde-mastery` path still requires deployment-level authentication, tenancy, timeout, and failure-path verification.
