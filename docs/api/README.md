# Tinlance API v1

Tinlance API v1 is the stable customer/integration boundary around Tinlance Core. The public URL space is `https://tinlance.com/v1/...`; the Next.js implementation is internally mounted under `/api/v1` and rewritten to `/v1`.

## Contract

- OpenAPI: `docs/api/openapi/v1.json`
- OpenAPI Specification: 3.1.1
- API contract version: `v1` / initial document version `1.0.0`
- Timestamps: RFC 3339 UTC
- JSON field naming: camelCase
- Errors: `application/problem+json`, RFC 9457-compatible
- Request correlation: `X-Request-ID`

## Authentication

Browser/first-party calls may use the existing Better Auth session. External integrations use organization-scoped bearer API credentials created by an authorized organization administrator.

API keys are shown once, never stored in plaintext, can expire, and can be revoked. Credentials are scoped to an organization and inherit no permissions from an arbitrary organization identifier supplied by the caller.

Example:

```http
Authorization: Bearer tl_live_...
```

Do not place credentials in query strings or URLs.

## Scopes

- `projects:read`, `projects:write`
- `assessments:read`, `assessments:write`, `assessments:execute`
- `findings:read`
- `evidence:read`
- `reports:read`
- `remediation:read`
- `workflows:read`, `workflows:execute`
- `webhooks:read`, `webhooks:write`

Scopes are checked before the domain operation. Resource authorization additionally requires organization ownership of the target object.

## Resources

The stable v1 surface is intentionally small:

- Projects: list, create, read, update
- Project assessments: list, create
- Assessments: read, execute
- Findings: list, read
- Evidence metadata: list, read
- Reports: list, read
- Remediations: list, read
- Workflow runs: read, cancel
- API credentials: create/list/revoke through authenticated organization administration
- Webhooks: create/list/disable/rotate secret

Internal workspace, automation-control, admin, FDE gateway and legacy application routes are not part of the stable customer contract.

## Asynchronous assessment execution

`POST /v1/assessments/{assessmentId}/execute` returns `202 Accepted` and a `workflowRunId`. Execution is delegated to the existing M4 durable workflow engine. The public API never executes FDE capabilities directly.

Poll `GET /v1/workflow-runs/{runId}` for status. The workflow carries the request ID and tenant context through Tinlance Core → FDE API → FDE Mastery.

## Pagination

Collection endpoints accept `limit` and `cursor`.

- Default limit: 25
- Maximum limit: 100
- Cursors are opaque and must not be interpreted by clients.
- Results are bounded and ordered by a stable server-defined ordering.

## Idempotency

High-impact/retryable mutations require `Idempotency-Key` (1–255 characters). Keys are scoped to an organization, HTTP method and path and are retained for 24 hours.

Reusing a key with the same request returns the original response. Reusing it with a different request returns `409 idempotency_conflict`.

## Concurrency

Project updates support `If-Match` using an ETag. A stale representation receives `412 precondition_failed` rather than silently overwriting a newer update.

## Errors

Errors use the RFC 9457 problem-details media type with stable Tinlance `code` and `requestId` fields. Clients should branch on HTTP status plus `code`, not human-readable `detail` text.

Common codes include:

- `authentication_required`
- `authentication_invalid`
- `authorization_denied`
- `resource_not_found`
- `validation_failed`
- `conflict`
- `precondition_failed`
- `idempotency_required`
- `idempotency_conflict`
- `rate_limit_exceeded`
- `upstream_unavailable`

## Rate limits

Current v1 classes are per organization + credential/user + operation class over a 60-second window:

- read: 120 requests/minute
- write: 60 requests/minute
- expensive FDE/assessment execution: 5 requests/minute

`429` responses include retry metadata. Production requires the existing Upstash Redis limiter to be configured; there is no silent production fail-open.

These are platform protection limits, not billing entitlements.

## Webhooks

Customers can subscribe to stable event types through `POST /v1/webhooks`.

Webhook requests include:

- `X-Tinlance-Webhook-Id`
- `X-Tinlance-Event`
- `X-Tinlance-Timestamp`
- `X-Tinlance-Signature: v1=<HMAC-SHA256>`

The signature is computed over `<timestamp>.<raw JSON body>` using the webhook secret. Consumers must reject stale timestamps according to their replay window and deduplicate using the event ID.

Webhook destinations must use HTTPS and are rejected when they resolve to localhost, link-local, private, loopback or other blocked network ranges. Delivery is queued, retried with exponential backoff and marked dead after repeated failures. Redirects are not followed.

Initial customer event types emitted by the stable contract are `project.created` and `assessment.created`. Additional event names are reserved until the corresponding domain emission is implemented and verified.

## Versioning and compatibility

`/v1` is the major-version boundary. Additive, backward-compatible changes may ship within v1. Removing/renaming fields, changing field types or semantics, removing operations, changing authentication/authorization semantics, or otherwise breaking valid clients requires a new major-version migration.

Deprecations must document introduction, deprecation, sunset, replacement and migration. Deprecated resources may advertise `Sunset` when a concrete retirement date exists.

## Security boundary

The public API enforces authentication, scope/function authorization, object-level organization isolation, input schemas, bounded pagination, request size constraints inherited from the web platform, expensive-operation limits, idempotency and audit events. Customer-safe DTOs are used instead of returning Prisma models wholesale.

The design is tested against the OWASP API Security Top 10 themes, with particular emphasis on BOLA, broken authentication, property exposure/mass assignment, resource consumption, function authorization, sensitive business flows, SSRF, configuration, inventory and unsafe upstream consumption.
