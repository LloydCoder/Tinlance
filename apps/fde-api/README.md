# Tinlance FDE API

Phase 8 boundary for the FDE Mastery execution service.

## Contract

The service is intentionally isolated from the Next.js application. Tinlance calls it through authenticated, typed service-to-service requests.

Planned interfaces:

- `POST /v1/jobs` — submit an FDE execution job.
- `GET /v1/jobs/{job_id}` — retrieve job state.
- `POST /v1/jobs/{job_id}/cancel` — request cancellation.
- `GET /health` — liveness.
- `GET /ready` — readiness.

Security requirements:

- Short-lived service credentials.
- Request correlation IDs.
- Explicit tenant/organization context.
- Idempotency keys for job creation.
- No provider secrets exposed to clients.
- Structured errors without secret leakage.

The implementation will be added incrementally with contract tests before external execution is enabled.
