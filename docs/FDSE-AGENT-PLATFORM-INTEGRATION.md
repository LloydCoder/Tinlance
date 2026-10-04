# FDSE ↔ Agent Platform Integration

## Status

Phase III is implemented as a repository-level cross-system contract gate. The gate pins both external repositories to immutable commits, runs the Agent Platform's authoritative R10 execution conformance suite, and verifies the FDSE E5 integration contract against the Platform's public execution/API surfaces.

This is reference-contract integration verification, not a claim of live customer production deployment. Production deployment, durable provider readiness, and operational evidence remain separate gates.

## Ownership

- FDSE owns engineering meaning, required evidence, and the versioned integration contract.
- Agent Platform owns generic governed execution authority.
- Agent Platform SDK remains the developer surface; FDSE does not duplicate Platform authority.
- Tinlance/FDE Mastery remain domain/customer execution layers and are not granted generic Platform authority by this phase.

## Canonical contract

fdse-agent-platform-governed-execution.v1

The contract requires:

- authenticated tenant binding;
- governed-execution.v1;
- capability/version binding;
- policy/approval boundary;
- idempotent consequential execution;
- evidence/audit causality.

Required integration evidence includes:

- FDSE contract version;
- Platform contract version;
- tenant ID;
- request ID;
- idempotency key;
- execution fingerprint.

The Platform is the authority owner.

## Verification

The gate:

1. pins FDSE at 0bfc34212a453f9a79c706d81a5082f869f08987;
2. pins Agent Platform at 775132611af59d301abd4f03d86d4bcdf6806fef;
3. runs tests/test_r10_execution.py from the Platform repository;
4. constructs the FDSE integration contract;
5. verifies governed-execution.v1 identity and deterministic execution fingerprinting;
6. exercises the Platform authenticated API boundary and idempotency behavior;
7. proves tenant mismatch fails closed;
8. requires exactly one VERIFIED FDSE integration evidence record;
9. records a deterministic system-of-systems graph digest.

## Evidence boundary

A green gate proves that the pinned repository contracts are compatible with the tested reference implementation in a GitHub-hosted CI fixture.

It does not prove:

- live Platform deployment;
- production identity/provider configuration;
- production durable storage;
- production sandbox/secret infrastructure;
- customer integration;
- production SLOs;
- independent certification.

Those remain later system-of-systems and production gates.

## Failure policy

Missing, stale, conflicting, or unverified integration evidence must fail closed. FDSE never converts the presence of a Platform contract into execution authority.

## Next boundary

The next stage is broader system-of-systems validation: FDSE + FDE Mastery + Agent Platform + Tinlance + provider/CI/provenance/deployment/observability boundaries. That stage must validate the complete evidence spine without collapsing ownership boundaries.