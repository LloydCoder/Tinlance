# Sprint F — Platform Lifecycle Architecture

Sprint F makes the commercial lifecycle stateful, auditable and recoverable without replacing the existing M1/M3 architecture.

## Authoritative boundaries

| Concern | Authoritative source |
|---|---|
| Opportunity | `Opportunity.stage` |
| Proposal | `Proposal.status` + `ProposalVersion` |
| Invoice | `Invoice.status` + financial fields |
| Payment | `Payment` + verified Paystack events |
| Entitlement | `Entitlement.status` |
| Provisioning | `ProvisioningJob.status` |
| Onboarding | `Onboarding.status` |
| Workspace | existing `Project` + `ProjectWorkspaceState` |

The browser is never authoritative for payment, entitlement or access.

## Commercial boundaries

A proposal records what was agreed. An invoice records what is owed. A payment records what the provider actually settled. An entitlement records what the organization may use. Provisioning records what technical resources were activated. Onboarding records the operational work required to make the customer active.

## Payment flow

`Proposal ACCEPTED → Invoice SENT → Payment PENDING → verified Paystack event → Invoice PAID + Payment SUCCEEDED → Entitlement ACTIVE → Workspace provisioning → Onboarding ACTIVE`.

Amount, currency and provider reference are validated before financial state changes. Paystack webhook events are authenticated, deduplicated and audited. Replayed successful events converge without duplicate entitlement/provisioning effects.

## Outbox

Critical state changes commit together with durable `OutboxEvent` records. Email delivery and other side effects are processed after the transaction. Vercel `after()` provides prompt best-effort processing and a protected scheduled drain provides recovery. A failed side effect does not roll back verified financial state.

## Capability / evidence / claims

`content/capabilities.json` is the public capability registry. `content/evidence-registry.json` records evidence provenance and scope. `content/claim-registry.json` maps high-value claims to evidence. `claims:verify` checks references, repository paths, critical claim status and high-risk compliance language.

Evidence marked `CURRENT_HEAD` is repository-bound and must be re-verified when scoped implementation paths change.

## Product provisioning

The first concrete provisioning adapter is the Tinlance customer workspace: an entitlement creates/uses a Client, Engagement, Project and ProjectWorkspaceState in one transaction. The durable provisioning job remains explicit so future product adapters can be isolated behind the same boundary.

## Security invariants

1. No payment success from frontend state.
2. No entitlement without an explainable commercial source.
3. No provisioning without entitlement.
4. No cross-tenant access without organization authorization.
5. No replayed provider event may create duplicate financial effects.
6. No retry may create duplicate provisioning resources.
7. All high-value commercial transitions create audit records.
8. Public capability status is registry-backed.
