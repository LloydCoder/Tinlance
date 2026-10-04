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

## Research basis

The public framing uses established risk-management and software-supply-chain vocabulary without claiming certification or compliance by reference:

- NIST AI RMF 1.0 is a voluntary framework for managing AI risks and is currently being revised; Tinlance uses it as risk-management vocabulary, not as a certification claim.
- NIST SP 800-218 SSDF 1.1 provides secure software-development practices, including provenance-oriented release practices.
- OWASP Top 10 for Agentic Applications 2026 identifies agentic-specific risks including identity/privilege abuse, agentic supply-chain vulnerabilities, unexpected code execution, memory/context poisoning, insecure inter-agent communication and cascading failures.
- SLSA v1.2 defines supply-chain security levels, source/build tracks and provenance/attestation concepts.

These references inform terminology and review criteria only. They do not establish that Tinlance or FDSE is certified, compliant, independently assured or deployed in a customer's production environment.

## Integration phase status

- I1 — FDSE Public Architecture: complete.
- I2 — FDSE Product / Service Presentation: complete; merged in PR #111 as `398a8eb4944ab4ec1d32c7b7a3b0a4a7ff67d6cc`.
- I3 — FDE ↔ FDSE Website Integration: implementation complete on the current branch; merge gated on CI.
- I4 — Agent Platform ↔ FDSE Website Architecture: implementation complete on the current branch; merge gated on CI.
- I5 — Public Evidence / Claim Reconciliation: implementation complete on the current branch; merge gated on CI.
- I6 — Website Engineering / QA: implementation complete on the current branch; repository CI verification in progress.
- I7 — Production Verification: pending.

The Vercel project currently has an external provisioning failure affecting new preview deployments before the build starts. This is infrastructure/quota-side evidence, not an application build failure. Repository CI remains the authoritative merge gate for repository changes; production verification remains a later gated phase and must not be inferred from repository CI.

Each phase remains separately gated on implementation and CI evidence.

I6 verification includes the blocking CI route/SEO smoke test and the production deployment route check performed against the canonical `www.tinlance.com` deployment. Preview deployments remain subject to the Vercel project's current external provisioning condition.

## I5 reconciliation findings

The public Products page previously described Tinlance Agent Platform as “Private / M0 in progress”. That statement was stale relative to the public Agent Platform repository, which documents the governed-execution.v1 contract and the completed M0-M29 repository engineering sequence. The public status is now scoped as **Public / Repository Contract** with explicit limitations for external production deployment and customer integration.

The same evidence discipline remains in force for FDSE and FDE Mastery: repository implementation and contract evidence are not treated as customer production proof or independent certification.
