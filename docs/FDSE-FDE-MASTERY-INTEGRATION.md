# FDSE ↔ FDE Mastery Integration

## Status

Phase II contract integration is implemented in the Tinlance cross-repository validation gate. The gate checks the live FDE API → FDE Mastery execution path and then records the resulting execution evidence through the FDSE E5 integration contract.

This is **contract/integration verification**, not a claim of customer-production deployment.

## Ownership

- **FDSE** owns integration contract identity, required capabilities, evidence requirements, authority-owner semantics, and deterministic verification.
- **FDE Mastery** owns domain execution and domain-specific runtime behavior.
- **Tinlance FDE API** owns the customer-facing execution boundary and tenant/request authentication into FDE Mastery.
- **Agent Platform** remains the generic governed execution authority; this phase does not move that authority into FDE Mastery or FDSE.

## Canonical contract

`fdse-fde-mastery-execution.v1`

Required capabilities:

- tenant-scoped domain execution;
- request-identity preservation;
- result-integrity digest;
- revision-bound evidence.

Required evidence:

- request ID;
- tenant ID;
- domain;
- execution status;
- result digest;
- FDE Mastery revision.

The integration gate checks all eight FDE Mastery domains:

`cybersecurity`, `finance`, `healthtech`, `logistics`, `legal`, `revops`, `procurement`, and `custom`.

For every successful execution, the gate creates an FDSE `IntegrationEvidence` record with a deterministic SHA-256 payload digest and requires `SystemOfSystemsGraph.require_verified()` to accept exactly one VERIFIED record.

## Negative boundary checks

The integration gate also verifies that:

- tenant mismatch is rejected;
- missing idempotency keys are rejected;
- an undeclared/unverified FDSE contract fails closed.

## Evidence boundary

A green GitHub integration run proves that the specified repositories and contracts were compatible and executable in the CI fixture. It does not prove customer production deployment, customer data correctness, independent certification, or production SLO compliance.

The evidence model follows the same principle as SLSA provenance verification: evidence is useful only when it is inspected against explicit expectations, rather than accepted merely because an artifact or attestation exists.

## Pinning

The validation workflow checks out FDSE at an immutable commit SHA. FDE Mastery remains tested from its current main revision so the integration gate detects breaking changes in the domain execution surface.

## Next boundary

The next phase is FDSE ↔ Agent Platform integration. That phase must preserve the authority boundary: FDSE can express governed engineering intent and evidence requirements, but the Agent Platform remains authoritative for identity, authorization, approvals, runtime, tools, sandbox, budgets, and audit.
