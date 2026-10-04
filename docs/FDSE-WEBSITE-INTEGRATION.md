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

## Remaining integration phases

I1 establishes the public architecture only. It does not close:

- I2 product/service presentation;
- I3 FDE ↔ FDSE website integration;
- I4 Agent Platform ↔ FDSE website architecture;
- I5 public evidence/claim reconciliation;
- I6 website engineering/QA;
- I7 production verification.

Each phase remains separately gated on implementation and CI evidence.
