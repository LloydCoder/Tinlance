# Billing & Paystack Webhooks

## Trust model

A payment webhook is treated as an untrusted external event. Tinlance verifies authenticity and validates the event before mutating application state.

```text
Paystack
   │
   ▼
Webhook endpoint
   │
   ├── request-size limit
   ├── signature verification
   ├── JSON/event validation
   ├── event-id extraction
   ▼
WebhookEvent idempotency
   │
   ▼
Transactional invoice update
   │
   └── audit event
```

## Request protection

The webhook accepts a maximum payload of **65,536 bytes**. Oversized payloads are rejected with `413 payload_too_large` before normal processing.

The Paystack signature is verified before the event is processed. Invalid signatures are rejected with `401 invalid_signature`.

Malformed JSON and incomplete event structures are rejected rather than being interpreted as trusted payment state.

## Idempotency

Webhook delivery is retryable. Tinlance persists a `WebhookEvent` record containing:

- `provider`
- `eventId`
- `eventType`
- `receivedAt`

The database enforces uniqueness on `(provider, eventId)`.

A duplicate event is acknowledged without applying the payment transition a second time:

```json
{
  "received": true,
  "duplicate": true
}
```

This protects invoice state from repeated delivery of the same Paystack event.

## Invoice state transitions

Supported webhook mappings include:

| Event | Invoice state |
|---|---|
| `charge.success` | `paid` |
| `charge.failed` | `failed` |
| `refund.processed` | `refunded` |
| `invoice.payment_failed` | `failed` |

The invoice transition and corresponding audit event are performed transactionally.

## Auditability

Webhook processing records operational evidence including organization context, action, resource/resource ID, request ID, event ID, payment reference, and previous/new state where available.

Unmatched payment references are recorded rather than silently discarded. This makes reconciliation and incident investigation possible.

## Failure behavior

Webhook handlers must fail closed on authentication and validation failures. They must not expose stack traces, credentials, provider secrets, or internal database details in public responses.

Transient processing failures must be observable and safely retryable. Idempotency must remain effective across retries.

## Production verification

Before declaring billing production-ready, verify with a real Paystack delivery:

1. valid signature is accepted;
2. invalid signature is rejected;
3. oversized body is rejected;
4. malformed body is rejected;
5. valid event persists exactly once;
6. duplicate event does not duplicate the state transition;
7. invoice state is updated transactionally;
8. audit event is created; and
9. request/event correlation is visible in operational logs.

## Security baseline

Webhook security is reviewed against OWASP ASVS 5.0 controls covering input validation, authentication, authorization, data integrity, error handling, logging, and secure configuration.
