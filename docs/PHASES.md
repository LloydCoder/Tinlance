# Tinlance Delivery Phases

Tinlance uses gated delivery. A phase is complete only when implementation, documentation, validation, required CI checks and the resulting merge evidence are complete.

## Historical foundation

The original Phase 0–9 sequence and M0–M14 implementation records remain historical provenance. They are not the active FDSE integration ledger.

## Current FDSE integration track

The FDSE repository/domain-contract track is complete at M0–M18 + E1–E6 in LloydCoder/tinlance-fdse. The Tinlance website integration is a separate gated track and must not be represented as complete merely because the FDSE repository is complete.

### I1 — FDSE Public Architecture

**Complete.** Implemented, merged as `cba044eb28f015072d114d57b71d5bb75f9579a3`, and covered by the required repository gates. The public page still does not claim live FDSE production integration.

- canonical /engineering/fdse route;
- explicit FDSE responsibility boundary;
- FDE Mastery relationship;
- Agent Platform relationship without claiming live production integration;
- evidence/status discipline;
- engineering-hub navigation;
- sitemap inclusion;
- claim/evidence registry entries;
- website integration boundary documentation.

### I2 — FDSE Product / Service Presentation

**Complete.** Implemented in PR #111 and merged as `398a8eb4944ab4ec1d32c7b7a3b0a4a7ff67d6cc`. The final implementation revision `80a906dcee78a4fef6c9dcb2fa438f8742b99ef9` passed all Tinlance GitHub Actions gates; Vercel preview provisioning remained an external infrastructure failure before the build started and is tracked separately from repository CI.

- commercial/product positioning;
- capability presentation;
- assessment relationship;
- implementation/test/validation/planned status;
- no unsupported standalone FDSE pricing or production claims.

### I3 — FDE ↔ FDSE Website Integration

**Complete.** Merged in PR #112 as `9d23d68325da4b90aa064cfb68304aecc2b1890d`; all required repository checks passed before merge.

- FDE Mastery now links directly to the FDSE public boundary;
- the engineering evidence map records the FDE Mastery → FDSE responsibility relationship;
- the FDE integration documentation reconciles technical assessment, FDE API execution and FDSE assurance semantics;
- capability/evidence/claim registries record the public relationship without claiming live runtime integration;
- repository and production evidence boundaries remain explicit.

I3 merge evidence includes the FDE Mastery → FDSE journey, engineering evidence relationship, reconciled assessment/API semantics, and explicit non-production-integration claim boundaries.

### I4 — Agent Platform ↔ FDSE Website Architecture

**Implementation complete on the I4 branch; merge remains gated on CI.**

- FDSE now explains the Agent Platform as the generic governed execution authority;
- the public page documents the implemented governed-execution.v1 responsibility boundary;
- identity, tenant, capability, policy, risk, approval, execution, evidence and audit ownership is explicitly separated;
- the Agent Platform repository and R10 contract are linked as inspectable architecture evidence;
- capability/evidence/claim registries record the contract without claiming live FDSE-to-Platform production integration;
- FDE integration documentation is reconciled with the same authority boundary.

### I5 — Public Evidence / Claim Reconciliation

**Implementation complete on the I5 branch; merge remains gated on CI.**

- audited the FDSE/FDE Mastery/Agent Platform public positioning and machine-readable evidence/claim registries;
- corrected the stale Products-page claim that Agent Platform was “Private / M0 in progress”;
- added an explicit Agent Platform repository/R10 evidence record and public capability record;
- reconciled repository-level implementation/contract status with production-deployment limitations;
- preserved the rule that repository evidence is not customer proof, production deployment evidence or independent certification;
- verified the public FDE Mastery, FDSE and Agent Platform relationship claims against their source repositories.

### I6 — Website Engineering / QA

- responsive UI;
- accessibility;
- SEO/metadata;
- route/link integrity;
- automated tests;
- build/typecheck/lint/security gates.

### I7 — Production Verification

- production deployment;
- route smoke tests;
- browser verification;
- production metadata/sitemap/robots verification;
- runtime error review;
- deployment and CI evidence.

## Later cross-system validation

After I1–I7, the remaining FDSE initiative continues through cross-repository integration with FDE Mastery and Agent Platform, system-of-systems validation, enterprise validation, customer/production validation and final certification/GA. Those stages are not silently included in I1.
