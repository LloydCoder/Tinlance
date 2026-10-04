# FDSE Phase VI — Customer / Production Validation

## Status

Phase V is complete. Phase VI is the real-world validation boundary between repository/system evidence and customer-operational evidence.

This phase follows the production-readiness principle that operational readiness must cover architecture/dependencies, instrumentation and monitoring, emergency response, capacity/performance, change management, and user-visible reliability. It also preserves the FDSE evidence rule: synthetic CI evidence is not customer evidence.

## Gates

| Gate | Requirement | Evidence class |
|---|---|---|
| VI1 | Internal Tinlance end-to-end engineering lifecycle | Real Tinlance system |
| VI2 | Controlled customer environment | External/customer evidence — mandatory |
| VI3 | Real repository validation | Real Git repository |
| VI4 | Real CI/CD validation | Real GitHub Actions lifecycle |
| VI5 | Security and supply-chain validation | Real release/deployment boundary |
| VI6 | Operational/SLO validation | Production observations |
| VI7 | Production Readiness Review | Human/operational acceptance |

## VI1 — Internal Tinlance E2E

Validate:

Customer request → Tinlance → FDE Mastery → FDSE → Agent Platform → governed engineering execution → evidence → evaluation/assurance → outcome.

The repository workflow validates the available internal path and records its limits. It must not claim that the customer path has been exercised.

## VI2 — Controlled customer environment

A real external/customer environment is required. The gate must record:

- customer/environment identifier without exposing confidential data;
- immutable application/repository revisions;
- deployment target;
- tenant identity and isolation evidence;
- authorization/approval behavior;
- real repository and CI/CD integration;
- security and supply-chain results;
- operational observations;
- rollback/recovery evidence;
- customer acceptance or designated technical-owner sign-off.

A synthetic GitHub fixture, Tinlance's own repository, or a CI database does **not** satisfy VI2.

GitHub deployment environments are suitable for protected operational gates because they can restrict deployment branches and require reviewers before protected environment secrets are exposed.

## VI3 — Real repository validation

Use an actual repository boundary rather than fixtures. The current Tinlance repository is valid evidence for internal validation and can exercise the FDSE contracts against real commits, branches, workflows and artifacts. It is not customer evidence for VI2.

## VI4 — Real CI/CD validation

Validate the real GitHub Actions lifecycle, including source revision, workflow execution, release gates, artifacts and failure behavior. The validation must preserve immutable revision identity.

## VI5 — Security and supply chain

Re-run the release security controls against the real release candidate:

- static analysis;
- dependency audit;
- secret scanning;
- container scanning;
- SBOM;
- provenance/attestation;
- release-tree integrity.

SLSA v1.2 treats provenance as verifiable information connecting an artifact to the moving parts that produced it. FDSE therefore treats provenance as release evidence rather than a documentation-only claim.

## VI6 — Operational/SLO validation

Production observations must be expressed as user-relevant reliability evidence:

- availability;
- latency;
- error rate;
- capacity/load behavior;
- monitoring;
- alertability;
- recovery;
- change/rollback behavior.

CI characterization must not be promoted to production SLO evidence.

## VI7 — Production Readiness Review

The final Phase-VI operational gate must review:

- architecture and dependencies;
- security;
- supply chain;
- observability;
- incident response;
- capacity;
- change management;
- rollback;
- ownership/on-call;
- SLOs;
- customer acceptance evidence.

Phase VII cannot begin until the PRR accepts the service and every Phase-VI gate is evidenced.

## External validation references

- NIST SP 800-61 Rev. 3 — incident response and recovery.
- NIST SP 800-218 SSDF 1.1 — secure software development and provenance.
- OpenTelemetry Semantic Conventions — common naming for telemetry across traces, metrics and logs.
- SLSA v1.2 — source/build provenance and attestations.
- Google SRE Production Readiness Review — operational readiness, monitoring, emergency response, capacity, change management, performance and ownership.

These references inform the validation model; they do not constitute certification.

## Completion rule

Phase VI is complete only when VI1–VI7 have real evidence and the controlled customer environment has been exercised. No customer evidence may be fabricated, inferred from synthetic CI, or substituted with repository documentation.

## Current blocker

VI2 cannot be honestly closed without a real controlled customer environment. The implementation can prepare and validate the machinery, but customer evidence requires an actual external deployment and technical-owner/customer acceptance. Phase VII must remain closed until that evidence exists.
