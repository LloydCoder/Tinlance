# Tinlance API changelog

## v1.0.0 — initial stable contract

- Stable `/v1` public boundary.
- Organization-scoped API credentials with scopes, expiry and revocation.
- Projects and M3 customer-workspace resources exposed through customer-safe DTOs.
- Assessment creation and asynchronous execution through M4 durable workflows.
- Findings, evidence metadata, reports and remediations read contracts.
- Workflow-run status and explicit cancellation.
- Cursor pagination, bounded limits and `If-Match` project updates.
- RFC 9457-compatible errors with stable machine codes and request IDs.
- Organization/credential rate classes.
- Idempotency for project/assessment creation and high-impact workflow commands.
- Signed webhook subscriptions and durable retry delivery with SSRF controls.

## Compatibility policy

Within v1, additive changes are permitted when they do not invalidate existing valid requests or responses. Removing or renaming a field, changing a field type/meaning, removing an operation, changing required request properties, or changing authentication/authorization semantics is breaking and requires a major-version migration.

Deprecated operations must document their replacement and migration path and may advertise a `Sunset` response header when a concrete retirement date is known.
