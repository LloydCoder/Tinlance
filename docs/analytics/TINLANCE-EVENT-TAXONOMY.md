# Tinlance Growth Analytics — Canonical Event Taxonomy

**Version:** 1.0  
**Scope:** company-level growth and product analytics

## Purpose

This is the single canonical taxonomy for measurable growth behavior in Tinlance. It is intentionally separate from `AuditEvent`, which records security and operational actions.

An analytics event is not evidence of revenue, qualification, customer value, or causality by itself.

## Event envelope

Every emitted event should conform to:

| Field | Required | Meaning |
|---|---|---|
| `event_name` | yes | Canonical event name |
| `schema_version` | yes | Envelope schema version |
| `event_id` | yes | Unique event identifier |
| `timestamp` | yes | Event time |
| `anonymous_id` | conditional | Stable anonymous browser/device identifier where appropriate |
| `user_id` | conditional | Authenticated user identifier |
| `organization_id` | conditional | Authorized organization identifier |
| `source` | yes | Acquisition or application source |
| `path` | conditional | Relevant public route |
| `referrer` | conditional | Referring source |
| `campaign` | conditional | UTM/campaign context |
| `entity_id` | conditional | Related content/service/assessment/lead/project identifier |
| `privacy_class` | yes | Data classification |

## Event classes

### Discovery

- `page_view`
- `content_view`
- `resource_view`
- `service_view`
- `proof_view`
- `github_referral`
- `external_referral`

### Engagement

- `content_engagement`
- `cta_view`
- `cta_click`
- `service_interaction`
- `resource_download`

### Assessment

- `assessment_viewed`
- `assessment_started`
- `assessment_progressed`
- `assessment_completed`
- `assessment_result_viewed`
- `assessment_cta_clicked`

### Lead and booking

- `lead_form_started`
- `lead_captured`
- `booking_started`
- `booking_completed`

### Commercial

- `lead_qualified`
- `opportunity_created`
- `proposal_created`
- `proposal_accepted`
- `deal_won`
- `deal_lost`

### Delivery / customer value

- `project_started`
- `project_milestone_reached`
- `customer_activated`
- `customer_outcome_recorded`
- `customer_expanded`
- `customer_churned`

### Advocacy

- `advocacy_requested`
- `testimonial_received`
- `referral_received`
- `case_study_authorized`

### Product / OSS

- `product_viewed`
- `product_activation_started`
- `product_activated`
- `product_repeat_usage`
- `oss_documentation_viewed`
- `oss_install_intent`
- `oss_commercial_intent`

### Experimentation

- `experiment_exposed`
- `experiment_converted`

## Event rules

1. Emit events only for real user/application behavior.
2. Do not emit `deal_won` merely because a form was submitted.
3. Do not emit customer events from client-side claims alone when the server has authoritative state.
4. Do not put secrets, authentication tokens, payment secrets, raw message bodies, or unnecessary PII in event properties.
5. Do not use analytics events as authorization input.
6. Event emission must be idempotent or safely duplicate-tolerant where downstream reporting requires it.
7. Changes to event names or required fields require a schema-version decision.
8. Derived metrics must identify their calculation method.

## Attribution dimensions

Where technically available and lawful to retain:

- `first_touch_source`
- `last_touch_source`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `landing_path`
- `content_id`
- `service_id`
- `assessment_id`
- `referral_id`
- `outbound_campaign_id`

## Primary funnel

```text
page_view
→ content/service engagement
→ cta_click
→ assessment_started
→ assessment_completed
→ lead_captured
→ lead_qualified
→ booking_completed
→ opportunity_created
→ proposal_created
→ deal_won
→ project_started
→ customer_activated
→ customer_outcome_recorded
→ customer_expanded
→ advocacy
```

Not every user follows this sequence.

## Primary business metric

The strategic Tinlance planning metric is **revenue per qualified visitor**. It must only be reported when the underlying qualified-visitor and revenue data are actually available.

Supporting metrics include conversion rates, qualified pipeline, win rate, ACV, recurring revenue, retention and expansion.

## Privacy classification

Minimum classifications:

- `PUBLIC`
- `INTERNAL`
- `PERSONAL`
- `CUSTOMER`
- `SENSITIVE`
- `FINANCIAL`
- `SECURITY_SENSITIVE`

Analytics should use the least sensitive classification necessary.

## Provider boundary

The application should emit through a provider-neutral event interface. Analytics vendors such as PostHog are adapters, not sources of business truth.

Current repository audit did not establish a complete PostHog implementation. Provider configuration and production delivery must therefore remain an explicit verification item.

## Validation checklist

Before an event is considered implemented:

- [ ] Trigger is identified in actual application code.
- [ ] Event schema is documented.
- [ ] Identity behavior is defined.
- [ ] Attribution behavior is defined.
- [ ] Privacy class is defined.
- [ ] Duplicate behavior is defined.
- [ ] Tests cover the event where business logic is involved.
- [ ] Provider delivery is verified if a provider is used.
- [ ] Reporting interpretation is documented.
