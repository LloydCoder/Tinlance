# Sprint F Security Runbook

## Payment webhook compromise

- Rotate the Paystack secret through the deployment secret store.
- Verify signature failures and provider event IDs.
- Review `WebhookEvent`, `Payment`, `Invoice` and audit records for anomalous transitions.
- Reconcile provider-side transactions before any corrective financial action.

## Entitlement abuse

- Identify the organization, user, entitlement source and resource.
- Disable/revoke the entitlement server-side if required.
- Preserve the source chain and audit trail.
- Check for provisioning artifacts created from the entitlement.

## Unauthorized access

- Validate session, organization membership, role/permission and entitlement independently.
- Inspect cross-tenant access logs.
- Do not remediate by changing client-side plan state.

## Provisioning abuse

- Inspect deterministic provisioning key and job history.
- Stop/revoke the entitlement if the provisioning request is not authorized.
- Rotate any affected integration credentials through the secret-management mechanism.

## Suspicious administrative override

- Identify the actor and reason.
- Preserve before/after state and request/correlation identifiers.
- Review whether the override changed money, entitlement or provisioning state.
- Require a second operator review for material financial corrections.

## Audit investigation

Use correlation/request IDs to reconstruct:

`proposal → invoice → payment provider event → entitlement → provisioning → onboarding → workspace`.

Never place secrets, authentication tokens or payment credentials in audit metadata.
