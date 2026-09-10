# M13 — Proprietary Knowledge Moat

M13 is Tinlance's governed intelligence transformation layer. It converts legitimately obtained, permissioned engagement-derived observations into reusable intelligence without turning customer records into a shared knowledge corpus.

## Boundary

- **M3** remains the customer/engagement system of record. M13 stores references and derived, minimized content; it does not crawl or copy raw evidence.
- **M7** remains the authorization and security authority. M13 calls the existing security gateway and never grants permissions.
- **M8** remains the evaluation authority. Privacy/security regression is release-blocking.
- **M9** may assist with bounded extraction/discovery but cannot approve or publish.
- **M10** remains the organizational knowledge/RAG authority. M13-derived material is eligible for M10 only after governance.
- **M11** may consume only explicitly public-approved M13 intelligence.
- **M12** may consume only appropriately aggregated intelligence; M13 is not a shadow CRM.

## Safety model

The implemented first release is deliberately deterministic. It performs source eligibility checks, secret/identifier detection, minimization/generalization, a conservative re-identification risk score, evidence/provenance recording, explicit human approval, publication-scope checks, and revocation.

De-identification is **not** treated as irreversible anonymization. Public release requires contractual reuse permission, an explicit public approval, a low/acceptable risk result, and a minimum independent-source cohort for public-safe repeated observations. A single engagement cannot become a population statistic.

Raw customer content, credentials, tokens, private endpoints, and direct identifiers are not persisted by M13. The source table contains a protected engagement reference and governance metadata only.

## Lifecycle

`ELIGIBLE → HUMAN_REVIEW → APPROVED_INTERNAL/APPROVED_LIMITED/APPROVED_PUBLIC → PUBLISHED`

Negative terminal states are `REJECTED`, `REVOKED`, `EXPIRED`, and `SUPERSEDED`.

Approval binds to the exact candidate version, content hash, transformation version, policy version, reviewer, purpose, audience, and destination. Any future content version requires a new approval.

## Classification

M13 persists explicit classifications including `CUSTOMER_RESTRICTED`, `PERSONAL_DATA`, `SENSITIVE_PERSONAL_DATA`, `SECRET`, `CREDENTIAL`, `SECURITY_SENSITIVE`, `LEGALLY_RESTRICTED`, `DERIVED_INTELLIGENCE`, and `APPROVED_PUBLIC_INTELLIGENCE`.

## Provenance and audit

Each candidate retains protected source provenance, evidence hashes, transformation/policy versions, and approval records. Sensitive actions are also recorded through the existing `AuditEvent` ledger. Access events are recorded without storing raw query/content material.

## Publication and revocation

M13 publication is destination- and scope-bound. M11 is public-only. High/critical risk cannot be published. Revocation marks the candidate revoked and all active M13 publication rows revoked; downstream consumers must treat the publication as unavailable and rebuild derived representations according to their lifecycle.

## Synthetic assurance corpus

`apps/web/lib/intelligence/m13.test.ts` contains synthetic privacy/security fixtures. Production customer data must never be placed in tests, fixtures, prompts, or documentation.

## Important non-claims

M13 does not claim GDPR compliance, legal anonymization, irreversible anonymization, ISO/SOC certification, or regulatory approval. The controls are engineering safeguards and governance mechanisms.
