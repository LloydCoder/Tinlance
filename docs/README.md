# Tinlance Documentation

This directory is the maintainer-facing documentation authority for the Tinlance repository.

The repository contains current architecture and operations documentation as well as dated migration records and phase evidence. Historical records are retained for provenance; they do not override current code, CI, deployment evidence, or the canonical architecture.

## Documentation model

The navigation follows a Diátaxis-oriented model without forcing historical evidence into new categories:

| Mode | Purpose | Primary locations |
|---|---|---|
| Tutorials | Learn Tinlance by completing a task | API README, SDK READMEs, onboarding material |
| How-to | Solve a concrete operational or development problem | docs/automation, docs/security, docs/migrations, runbooks |
| Explanation | Understand architecture, boundaries, and decisions | docs/architecture, docs/authority, docs/decisions, FDE integration |
| Reference | Exact contracts, schemas, APIs, and inventories | docs/api, OpenAPI, phase records, security gates |

Historical audit and certificate files should remain dated and should not be rewritten as current operational truth.

## Canonical entry points

- [Architecture](architecture/tinlance-architecture.md)
- [Architecture decisions](decisions/README.md)
- [Evidence and trust](EVIDENCE-AND-TRUST.md)
- [FDE integration](FDE-INTEGRATION.md)
- [API v1](api/README.md)
- [Enterprise CI gates](ENTERPRISE-CI-GATES.md)
- [Security release gate](SECURITY-RELEASE-GATE.md)
- [Customer workspace](customer-workspace/M3_CUSTOMER_WORKSPACE.md)
- [Automation](automation/M4_FDE_AUTOMATION.md)
- [M11 AI Sales Engineer](m11-ai-sales-engineer.md)
- [M12 Revenue Intelligence](m12-revenue-intelligence.md)
- [M13 Knowledge Moat](m13-proprietary-knowledge-moat.md)
- [M14 Productization](m14-consulting-software-flywheel.md)
- [Migrations](migrations/legacy-site-inventory.md)
- [Security gates](security/GATE-D-SUPPLY-CHAIN.md)
- [Phase VI evidence](phase-vi/README.md)

## Current platform map

~~~text
Public website / assessment
        |
        v
M1 Commercial Engine -> M3 Customer Workspace -> M5 API
        |                         |
        +-------------------------v
        |                       FDE API -> FDE Mastery
        v
M4 Automation             M7 Security
        |                       |
        +---------------> M6 MCP / tools
                                |
                                v
                     M8 Evaluation -> M9 Agent Runtime <-> M10 Knowledge
                                           |
                                           v
                                  M11 Sales Engineer
                                           |
                                           v
                                  M12 Revenue Intelligence
                                           |
                                           v
                                  M13 Knowledge Moat
                                           |
                                           v
                                  M14 Productization
~~~

The diagram is a documentation map, not a claim that every arrow is a hard runtime dependency.

## Source-of-truth rule

When documentation conflicts with implementation:

1. Current source code and tests determine behavior.
2. Current CI/workflow evidence determines automated verification state.
3. Production checks determine production behavior.
4. Canonical architecture and authority documents explain intended boundaries.
5. Dated historical records preserve provenance but do not override current truth.

## Documentation contribution rules

- Use relative links for repository-local navigation.
- Keep examples runnable against the current code.
- Mark assumptions and limitations explicitly.
- Do not convert historical validation into universal production claims.
- Update the nearest canonical document when a boundary changes.
- Add a changelog entry for material documentation or contract changes.
