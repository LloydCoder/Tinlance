# M8 — Agent Evaluation & Assurance Plane

M8 is Tinlance's evaluation, regression, adversarial-testing and evidence layer. It does not authorize runtime actions. M7 remains the runtime authority.

## Implemented boundary

`Agent/Application → M6/M5/M4 → M7 → Core/FDE/M3` is the runtime path. M8 observes and tests that path through controlled evaluation inputs and recorded execution results.

M8 currently provides:

- versioned evaluation targets with configuration hashes;
- immutable global security dataset/suite definitions;
- deterministic security graders;
- severity-aware deployment gates;
- immutable baselines and baseline comparison;
- structured evaluation results and evidence hashes;
- trace records linked to evaluation runs;
- bounded red-team campaign registration with explicit scope/authorization checks;
- tenant-scoped API access through the existing M5 authentication path and M7 authorization;
- structured security findings for critical/high evaluation failures;
- M8 CI workflow for migration, typecheck, lint, deterministic meta-tests, build, dependency audit and secret scanning.

## Security corpus

The initial global `m8-security@1` corpus covers direct and indirect prompt injection, tool misuse, tenant isolation/BOLA, approval bypass, secret disclosure, jailbreaks, MCP/tool poisoning, excessive agency, SSRF, data exfiltration and FDE contract stability.

Security cases are mapped to OWASP Agentic 2026, OWASP GenAI/LLM, OWASP API Security and MITRE ATLAS identifiers where applicable. MITRE ATLAS is treated as the maintained adversarial taxonomy rather than a Tinlance replacement taxonomy.

## Deterministic grading

Security invariants are graded from execution evidence. An LLM judge is not used to override authorization, tenant isolation, secret, egress or approval assertions.

Critical and high security failures block the release gate by default. Aggregate quality cannot mask a critical security regression.

## Baselines and regression

A baseline is created only from a completed evaluation in which every evaluated case passes. The snapshot is content-hashed and historical runs retain their dataset, suite, grader, target and configuration versions.

Baseline comparison identifies newly failing cases and resolved failures. A security regression is a deployment blocker under the default production gate.

## Red teaming

Red-team registration is deliberately bounded. Production scope requires explicit authorization; arbitrary Internet scope is rejected; request and duration limits are mandatory; the campaign must target a registered evaluation target in the same tenant and matching environment.

M8 does not expose an unrestricted offensive executor. Execution adapters must enforce the campaign's scope and use sandbox/mock resources for dangerous cases.

## Trace privacy

M8 stores hashes/references for sensitive execution evidence rather than requiring unrestricted raw prompt/output persistence. Trace metadata is sanitized for credential-like values. Tenant IDs are retained only in tenant-scoped records.

## CI integration

The M8 workflow is an additional assurance gate alongside the existing Tinlance CI, M6 MCP security workflow and M7 security workflow. It does not replace them. Vercel deployment is intentionally outside this phase and remains a separate deployment-verification concern.

## Framework alignment

- OWASP Top 10 for Agentic Applications 2026
- OWASP GenAI/LLM Top 10 2026
- OWASP API Security Top 10
- MITRE ATLAS
- NIST AI RMF and Generative AI Profile

These frameworks inform coverage and mappings; passing M8 means only that the configured evaluation suite and its defined scope passed.
