# Tinlance Company Growth OS — Architecture

## Objective

The Tinlance Growth OS is a company-level operating layer connecting public discovery, authority, conversion, delivery, customer value, expansion and evidence. It is not a second application and it is not a replacement for the existing platform architecture.

## System boundary

```text
                         TINLANCE GROWTH OS
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
   DISCOVERY                AUTHORITY              DEMAND INTEL
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                ↓
                           ENGAGEMENT
                                ↓
                    DIAGNOSTIC / ASSESSMENT
                                ↓
                              LEAD
                                ↓
                         QUALIFICATION
                                ↓
                           OPPORTUNITY
                                ↓
                 ┌──────────────┴──────────────┐
                 ↓                             ↓
             AI SECURITY                       FDE
                 ↓                             ↓
                 └──────────────┬──────────────┘
                                ↓
                           PROJECT / PILOT
                                ↓
                         RETAINER / PRODUCT
                                ↓
                          CUSTOMER VALUE
                                ↓
                            EXPANSION
                                ↓
                     ADVOCACY / EVIDENCE
                                ↓
                            RESEARCH
                                ↓
                         CONTENT / OSS
                                ↓
                           DISCOVERY ↺
```

## Repository architecture

```text
apps/web
├── public authority
├── conversion
├── authenticated customer portal
├── admin / operations
└── versioned API
        │
        ├── Better Auth / tenant authorization
        ├── Prisma / Neon
        ├── billing / Paystack
        ├── growth event layer          ← this OS
        └── FDE gateway
                 │
                 └── fde-mastery
```

## Growth data model principles

Growth telemetry should be:

- append-oriented where practical;
- schema-validated;
- privacy-classified;
- attributable when attribution exists;
- explicitly anonymous or identified;
- separated from security audit logs;
- safe to replay without creating business side effects;
- unsuitable as an authorization source.

Security audit records remain authoritative for security-sensitive actions. Marketing analytics must never be used to authorize access.

## Core entities

The existing platform already has `Lead`, `Booking`, `Project`, `Invoice`, `Organization`, `Member`, `AuditEvent`, and related identity/customer records. The Growth OS should reference those entities rather than creating duplicate lead, customer or billing stores.

Where additional growth state is required, prefer explicit bounded models such as:

- acquisition context;
- growth event;
- assessment instance;
- opportunity;
- experiment;
- lifecycle subscription.

Do not add all of these models merely because they appear in the architecture. Add them when the corresponding workflow is implemented.

## Canonical lifecycle

```text
anonymous visitor
→ engaged visitor
→ diagnostic started
→ diagnostic completed
→ lead
→ qualified lead
→ discovery/meeting
→ assessment
→ proposal
→ project/pilot
→ customer
→ activated
→ retained
→ expanded
→ advocate
```

A person or organization can enter at different points and can move through more than one commercial path.

## Commercial paths

### AI Security

```text
Research / Search
→ AI security content
→ assessment
→ gap report
→ remediation
→ pilot
→ security retainer
→ platform / monitoring
```

### FDE

```text
FDE content / referral / outbound
→ technical assessment
→ scope
→ FDE sprint
→ deployment
→ outcome
→ retained FDE
→ repeatable playbook
```

### AI Engineering

```text
Engineering authority
→ architecture/problem discovery
→ technical assessment
→ implementation
→ production support
→ retained engineering
```

### Open source

```text
GitHub
→ documentation
→ installation / use
→ technical trust
→ organization adoption
→ commercial assessment
```

## Attribution model

Store attribution facts independently from derived reporting.

Recommended dimensions:

- first-touch source;
- last-touch source;
- referrer;
- landing path;
- UTM source;
- UTM medium;
- UTM campaign;
- content identifier;
- assessment identifier;
- product/service identifier;
- referral identifier;
- outbound campaign identifier.

Derived metrics must declare their attribution method. Do not imply multi-touch causality when only source correlation exists.

## Event contract

All public growth events use the canonical event taxonomy in `docs/analytics/TINLANCE-EVENT-TAXONOMY.md`.

Events should carry a stable envelope containing:

```text
event_name
schema_version
event_id
timestamp
anonymous_id (when available)
user_id (when authenticated)
organization_id (when authorized and appropriate)
source
path
referrer
campaign context
entity identifiers
privacy classification
```

Never include passwords, tokens, payment secrets, raw authentication material, or unnecessary customer content.

## Provider boundary

The Growth OS must not hard-code itself to a single analytics vendor.

```text
Application event
      ↓
Canonical event contract
      ↓
Provider adapter(s)
      ↓
Analytics / reporting
```

PostHog is an intended supporting dependency from the strategic architecture, but current repository evidence does not establish a live PostHog implementation. Therefore provider integration remains an explicit dependency until verified.

## Assessment boundary

Assessment scoring is a decision-support mechanism, not an authoritative security certification. Assessment outputs should preserve evidence, methodology, limitations and confidence.

## Automation boundary

Automation may:

- classify;
- score;
- route;
- notify;
- suggest.

Automation must not silently perform high-impact actions without the appropriate authorization and approval boundary.

## FDE boundary

Tinlance owns commercial/customer context and the authenticated gateway. `fde-mastery` owns the deeper execution/policy/tool/model control plane. This avoids duplicate business and security authority.

## Growth OS non-goals

The current branch does not attempt to:

- replace the CRM with a new platform;
- create a generic marketing automation suite;
- build speculative MCP infrastructure;
- create an AI agent with unrestricted database access;
- manufacture traffic or revenue metrics;
- turn every content page into a landing page;
- treat `llms.txt` as a guaranteed search ranking mechanism.
