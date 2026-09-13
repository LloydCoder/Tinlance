# Sprint F Operations Runbook

## Payment mismatch

1. Do not manually mark the invoice paid.
2. Inspect `Payment`, `Invoice`, `WebhookEvent` and `ReconciliationException`.
3. Compare provider reference, amount and currency.
4. Resolve the exception only after provider-side evidence is verified.
5. Record the privileged resolution action and reason.

## Duplicate webhook

A duplicate event ID should return `duplicate: true` without changing financial state. A different event ID for an already-succeeded reference is treated as a replay and must not recreate entitlement or provisioning.

## Payment succeeded, provisioning failed

Payment and invoice remain successful. Inspect `Entitlement` and `ProvisioningJob`, then retry the provisioning job. Never charge the customer again.

## Customer cannot access a paid capability

1. Verify organization membership and role.
2. Verify entitlement status and effective dates.
3. Trace entitlement source to payment/invoice/proposal.
4. Inspect workspace/project state.
5. Do not grant access by changing frontend plan state.

## Email failed

Inspect `OutboxEvent` and `EmailDelivery`. Retry the outbox event after fixing provider configuration. Email failure must not reverse a commercial state transition.

## Proposal superseded

Only the accepted proposal version may drive fulfillment. A later draft/version cannot silently replace an already accepted version.

## Refund / revocation

Verify the provider refund event, update payment/invoice state, revoke the linked entitlement and block onboarding. Preserve records; do not delete commercial history.

## Provider outage

Keep invoice/payment state at the last verified state. Do not infer success from redirect pages, client callbacks or provider-unavailable responses. Reconcile after provider recovery.

## Administrative intervention

Any future manual override must be server-side, privilege-gated, reasoned and audited with before/after state. There is intentionally no hidden unrestricted endpoint.
