# M14 — Consulting → Software Flywheel

M14 is Tinlance's evidence-backed problem-to-product layer. It records authorized problem observations, normalizes them into patterns, validates recurrence, scores opportunities, versions playbooks, runs controlled product experiments, and records human productization decisions.

## Source-of-truth boundaries

- **M3** remains the source of customer delivery records. M14 stores source references and governed summaries rather than copying customer records.
- **M13** is the boundary for cross-customer intelligence. An M14 pattern may reference an active M13 `IntelligencePattern` only when that governed pattern has at least two source organizations. Raw customer evidence is never promoted directly into M14 cross-customer intelligence.
- **M4** remains the workflow execution system. M14 playbooks describe reusable work; execution should be delegated to M4 rather than implemented as a second workflow engine.
- **M5** is extended with `/api/v1/productization/*` route handlers that call the M14 domain service.
- **M6/M7** remain the agent/tool and security control planes. The current M14 mutation API is privileged-human only; AI agents cannot approve lifecycle transitions. Any future MCP exposure must use the existing M6 policy path and M7 gateway.
- **M8** remains the evaluation authority. M14 refuses `PRODUCT_VALIDATED` and `PRODUCTIZED` transitions until the opportunity records an M8 `PASS`; the M8 run/evidence itself remains owned by M8.
- **M10** remains the reusable knowledge store. M14 does not create a RAG/knowledge database.
- **M11** must consume only approved product/public material; M14 internal scores and customer-derived evidence are not public content.
- **M12** remains the canonical commercial/revenue model. M14 stores productization economics as evidence/metrics but does not calculate a second revenue ledger.

## Lifecycle

`OBSERVED → NORMALIZED → PATTERN_CANDIDATE → RECURRENCE_VALIDATED → OPPORTUNITY → PLAYBOOK_CANDIDATE → PLAYBOOK_VALIDATED → AUTOMATION_CANDIDATE → AUTOMATION_VALIDATED → PRODUCT_CANDIDATE → PRODUCT_EXPERIMENT → PRODUCT_VALIDATED → PRODUCTIZED → SCALED`

Exception states include `REJECTED`, `DEFERRED`, `DUPLICATE`, `INSUFFICIENT_EVIDENCE`, `NOT_REPEATABLE`, `NOT_ECONOMIC`, `SECURITY_BLOCKED`, `CUSTOMER_SPECIFIC`, `SUPERSEDED`, and `RETIRED`.

Transitions are explicit and auditable. AI principals cannot approve transitions.

## Recurrence

M14 does not use a single `count >= N` rule. The v1 recurrence gate requires independent organizations/governed source organizations plus explicit problem and solution similarity signals. The implementation records occurrence and organization counts and the methodology used.

For cross-customer signals, the preferred source is an M13-governed `IntelligencePattern`. Direct customer observations remain organization-scoped.

## Explainable scoring

The v1 policy is versioned as `m14-policy-v1`. The dimensions are:

- recurrence 14%
- customer pain 10%
- economic value 10%
- willingness to pay 10%
- solution repeatability 12%
- delivery repeatability 10%
- automation feasibility 8%
- security feasibility 10%
- market breadth 8%
- evidence quality 8%

Every score stores its value, weight, confidence, evidence references and policy version. The score is decision support; it is not a product-market-fit claim.

## Product experiments

Experiments capture hypothesis, segment, offer, price, success criteria, actual behavior, customer feedback, conversion, delivery/support effort, technical cost, security findings, evaluation results, commercial outcome and the resulting decision (`ITERATE`, `EXPAND`, `PRODUCTIZE`, `KEEP_AS_SERVICE`, `AUTOMATE_INTERNALLY`, `DEFER`, `KILL`).

## Playbooks

Playbooks are versioned. A new version must have a monotonically increasing version number and receives a content hash. Validated playbooks describe permissions, inputs, steps, decision points, human approvals, outputs, security controls, failure conditions and rollback. M14 does not execute the workflow itself.

## Security model

M14 mutation services invoke M7 and are exposed through privileged server-side authorization. Customer-derived classifications are retained. Audit records use `AuditEvent` with organization and request correlation. M14 never trusts frontend filtering as authorization.

Product promotion is fail-closed on evidence, M8 evaluation and security status. AI-generated recommendations are advisory and cannot self-approve.

## API

Current routes:

- `POST/GET /api/v1/productization/observations`
- `POST /api/v1/productization/patterns`
- `GET/POST /api/v1/productization/opportunities`
- `POST /api/v1/productization/opportunities/:id` with `action=evidence|score|transition`
- `POST /api/v1/productization/playbooks`
- `POST /api/v1/productization/experiments` (or `action=complete`)

All are privileged server-side routes and return RFC 9457-style `application/problem+json` errors on failures.

## What is intentionally not claimed

M14 does not claim product-market fit, market size, customer counts, revenue, margin, retention or willingness to pay unless those are supplied as actual evidence. No customer-specific implementation becomes reusable intelligence without the M13 boundary.

The current implementation provides the durable productization core and portfolio surface. Direct M4 execution adapters, a dedicated M6 MCP surface, and AI analyst orchestration should be added only through their existing control planes rather than by duplicating those subsystems inside M14.
