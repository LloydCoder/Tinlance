# Billing & Paystack Webhooks

## Trust model

A payment webhook is treated as an untrusted external event. Tinlance verifies authenticity and validates the event before mutating application state.

```text
Paystack
  |
  v
Webhook endpoint
  |
  +-- request-size limit
  +-- signature verification
  +-- JSON and event validation
  +-- event-id extraction
  v
WebhookEvent idempotency
  |
  v
Transactional invoice update
  |
  +-- audit event
```

## Request protection

The webhook accepts a maximum payload of **65,536 bytes**. Oversized requests are rejected with `413 payload_too_large`.

The Paystack signature is verified before the event is processed. Invalid signatures are rejected with `401 invalid_signature`.

Malformed JSON and incomplete event structures are rejected rather than interpreted as trusted payment state.

## Idempotency

Webhook delivery is retryable. Tinlance persists a `WebhookEvent` record containing `provider`, `eventId`, `eventType`, and `receivedAt`.

The database enforces uniqueness on `(provider, eventId)`. A duplicate event is acknowledged without applying the payment transition a second time:

```json
{
  "received": true,
  "duplicate": true
}
```

This protects invoice state from repeated delivery of the same Paystack event.

## Invoice state transitions

The implementation maps supported payment events to invoice states, including:

- `charge.success` -> `paid`
- `charge.failed` -> `failed`
- `refund.processed` -> `refunded`
- `invoice.payment_failed` -> `failed`

The invoice transition and corresponding audit event are performed transactionally.

## Auditability

Webhook processing records operational evidence including organization context, action, resource and resource ID, request ID, event ID, payment reference, and previous/new state where available.

Unmatched payment references are recorded rather than silently discarded. This makes reconciliation and incident investigation possible.

## Failure behavior

Webhook handlers fail closed on authentication and validation failures. They must not expose stack traces, credentials, provider secrets, or internal database details in public responses.

Transient processing failures must be observable and safely retryable. Idempotency remains effective across retries.

## Production verification

Before declaring billing production-ready, verify with a real Paystack delivery:

1. A valid signature is accepted.
2. An invalid signature is rejected.
3. An oversized body is rejected.
4. A malformed body is rejected.
5. A valid event persists exactly once.
6. A duplicate event does not duplicate the state transition.
7. The invoice state is updated transactionally.
8. An audit event is created.
9. Request and event correlation is visible in operational logs.

## Security baseline

Webhook security is reviewed against OWASP ASVS 5.0 controls covering input validation, authentication, authorization, data integrity, error handling, logging, and secure configuration.
