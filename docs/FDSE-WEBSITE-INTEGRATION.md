# FDSE Website Integration

## Status

Phase I1 — FDSE Public Architecture is complete at the repository level. The implementation is merged and the repository gates for the merge revision are green.

This document describes the public-information boundary. It does not claim that FDSE is already integrated with the live Tinlance production runtime, Agent Platform, or FDE Mastery execution path.

## Public architecture

The canonical public route is:

- /engineering/fdse

The route presents FDSE as Tinlance's engineering intelligence and assurance layer.

## Responsibility boundary

Tinlance
  ↓
Forward-Deployed Engineering
  ├── FDE Mastery
  │     └── domain engineering / delivery
  │
  └── FDSE
        └── engineering intelligence / assurance
              Context / Risk / Policy / Workflow
              Evidence / Evaluation / Assurance
              Security / Supply Chain / Lineage
  ↓
Agent Platform
  └── governed execution authority
  ↓
Customer systems

The diagram is a responsibility abstraction. It is not a production topology.

## Evidence discipline

Public statements distinguish:

- IMPLEMENTED — present in the repository.
- TESTED — covered by automated or reproducible tests.
- VALIDATED — supported by documented validation beyond ordinary implementation/testing.
- PLANNED — future work.

Repository evidence is not customer proof.

## External framing

The public positioning is consistent with established engineering risk-management practice. NIST describes AI RMF as a framework for managing AI risks and promoting trustworthy development and use, while noting that it is voluntary and that revision work is underway. OWASP's 2026 Agentic Applications work treats agentic systems as a distinct security surface requiring explicit controls. These frameworks inform the vocabulary; Tinlance does not claim certification or compliance merely by referencing them.

## Agent Platform contract boundary

The public FDSE page now documents the Agent Platform as the generic governed execution authority. The relationship is grounded in the Platform repository's implemented `governed-execution.v1` contract:

- Platform binds authenticated identity and tenant context;
- capability, policy and risk are evaluated before consequential execution;
- approvals are authenticated, tenant-scoped and action-bound where required;
- runtime/tool/MCP mediation, sandbox, secrets, budgets, evidence and audit remain Platform concerns;
- FDSE defines engineering meaning and assurance requirements but does not grant execution authority;
- the Platform repository's reference implementations and contracts are not presented as proof of a live FDSE production deployment.

The public page links to the Agent Platform repository and R10 contract as inspectable architecture evidence.

## Integration phase status

- I1 — FDSE Public Architecture: complete.
- I2 — FDSE Product / Service Presentation: complete; merged in PR #111 as `398a8eb4944ab4ec1d32c7b7a3b0a4a7ff67d6cc`.
- I3 — FDE ↔ FDSE Website Integration: implementation complete on the current branch; merge gated on CI.
- I4 — Agent Platform ↔ FDSE Website Architecture: implementation complete on the current branch; merge gated on CI.
- I5 — Public Evidence / Claim Reconciliation: pending.
- I6 — Website Engineering / QA: pending.
- I7 — Production Verification: pending.

The Vercel project has an external provisioning failure affecting new deployments before the build starts. Repository CI remains the authoritative merge gate for I3; production verification remains a later gated phase and must not be inferred from repository CI.

Each phase remains separately gated on implementation and CI evidence.
