# Tinlance Ecosystem — Master Production-Readiness Completion Plan

Audit baseline: 2026-11-14. This is a controlled execution plan, not a certification or assertion that every component is deployed.

Repositories:
- LloydCoder/Tinlance — customer platform, commercial engine, workspace, FDE gateway, API/MCP and customer evidence.
- LloydCoder/fde-mastery — governed agent execution platform, policy, workflow, tool/model gateways, evaluation, operations and SDKs.
- LloydCoder/tinlance-fdse — engineering/transformation domain contracts, evidence, assurance and certification.
- LloydCoder/Tinlance-FDSE-toolkit — private operator and field-delivery system.

## 1. Binding architecture decisions

| System | Authority |
|---|---|
| Tinlance | Customer-facing product, commercial lifecycle, workspace, tenant APIs, FDE gateway and customer-safe evidence projections |
| FDE Mastery | Sole generic execution authority: identity, tenancy, policy, approvals, runtime/sandbox, tools, models, workflows, secrets, budgets, audit and observability |
| FDSE | Engineering/transformation domain semantics, versioned workflow intent, evidence, provenance, evaluation and certification meaning |
| FDSE Toolkit | Authorized field-operator workflows, canonical engagement artifacts, evidence, findings, reports, IR playbooks, ROI and secure/offline delivery |
| Tinlance Agent System | Governed digital workforce; no model- or prompt-derived execution authority |
| Tinlyt / TWI | Web intelligence: discover, capture, preserve, examine, verify, monitor and deliver web evidence |

TAS authority chain is fixed: TADL declares → Agent OS composes → SDK transports → Agent Platform authorizes and executes → TSIC verifies. Agent Platform remains the sole consequential-execution authority. Agent OS owns lifecycle, scheduling and handoffs. Tinlyt owns evidence intelligence, not identity, policy or execution.

Global constraints: server-side authorization; tenant isolation; least privilege; secrets server-side; untrusted external/AI/MCP inputs; approval for consequential actions; immutable audit; human control; provider-neutral infrastructure where possible; no unapproved AWS or paid infrastructure; reuse rather than duplicate; no unsupported production/certification claims. Approved benchmark systems are approved for evaluation only; no code reuse or production integration without license, security and independent verification.

## 2. Current evidence baseline

### Tinlance
- Main: 829fd372e029d0d4a224cbb6fd51a0573d2a5570. One open PR: #140 technical SEO/crawler indexing, head 8b05510494be80e9c928066b9bcdca470a9fe72c. The audited head had 30 successful checks, but PR remained open and GitHub reported mergeability as unstable. Recheck exact head/base, review and branch rules before merge.
- M1 Commercial Engine code exists: server-side assessment intake/qualification, atomic Lead/Assessment/Opportunity/AuditEvent persistence, idempotency, abuse controls, opportunity state machine and booking/proposal paths. Full live booking, proposal acceptance, engagement, invoice and payment lifecycle still needs transaction/race/provider-failure verification.
- M3 Customer Workspace code and migrations exist. The M3 certificate is stale: it still references PR #58 and pending CI. Reconcile against current main and current runtime evidence. Current documented constraints: 4 MiB evidence upload, no malware scanning claim unless configured, authenticated HTML reports (not PDF), and live FDE execution/customer acceptance outstanding.
- Tinlance M6 means MCP Gateway. Streamable HTTP route, OAuth/bearer identity, tenant-scoped registry/data access, persisted security policy, approvals, rate limiting and workflow dispatch exist. Current adversarial tests are too shallow: attack labels are repeated against registry invariants rather than testing each attack against behavior. This is a concrete audit target.
- M7–M10 security gateway, evaluation, agent runtime and knowledge/RAG have dedicated workflows. M11–M14 cover AI Sales Engineer, revenue intelligence, proprietary knowledge moat and consulting-to-software flywheel. Verify production and real usage separately from repository presence.
- Recent main production smoke, supply-chain and secret-scan workflows were successful.

### FDE Mastery
- Main: 807c2c0e4bb1ca784f11e6ae552f7f7bf4ea65ad; no open PRs. Recent Platform Quality, SDK Quality, Release Attestation and Continuous Evaluation runs succeeded.
- Builds 1–30 are documented GREEN, including identity/tenancy, runtime, durable workflows, policy, tool/model gateways, eventing, evaluation, FinOps, deployment/DR, eight-domain intelligence, integration, MCP/A2A, agent security, SRE, API/SDK, marketplace, governance, customer value, entitlements, memory, privacy, identity governance, key lifecycle and production operationalization.
- Canonical domains: cybersecurity, finance, healthtech, logistics, legal, revops, procurement and custom.
- Production promotion still requires eight gates: golden data, approved tools, enterprise ingestion, evaluation, staging, shadow mode, human-in-loop and controlled actions. CI is not customer deployment evidence.

### FDSE
- Main: e1f213c918ba712666e4dd8a5db418caad0b060f; no open PRs; latest observed main CI success was 2026-10-08, so refresh exact-HEAD workflows.
- M0–M18 and E1–E6 are reported implemented at domain/contract level; Transformation P11–P15 is reported implemented at repository/domain level.
- M15 trusted memory semantics, M16 workflow runtime contracts, M17 multi-agent contracts and M18 governed skills/apps/extensions/connectors/packages are included.
- External dependencies remain: durable stores, repository collectors, Agent Platform runtime, real workflow orchestration, secrets/KMS, deployment/monitoring, real E2E and external attestation.

### FDSE Toolkit
- Main: 8cb4bedcd2c1755966bdc69a2be2393da609fe6e; no open PRs; functional, security, release and compatibility workflows passed on 2026-10-08. Refresh exact-HEAD CI.
- Phases 0–24 include contracts, evidence, adapters, risk, reporting, identity, scope, IR, regulatory, ROI, secure delivery, air-gap, binaries, supply chain, testing, security, provenance, CLI and continuous compatibility.
- Source package is documented engineering enterprise-ready. Production certification still requires exact production tag/artifact provenance, signed release, binary/air-gap evidence and authorized field acceptance.

### TAS / TADS / Tinlyt dependencies
- Latest context: FCP-00 complete, FCP-01 accepted, FCP-02/W5 blocked on a genuine uninterrupted eight-hour soak, FCP-03 active/incomplete, FCP-04–FCP-10 gated. The reported 22 benchmark references, including Bops and Bot HQ, are approved for evaluation, not proven passed or integrated.
- TADS sequence M0–M18: architecture/governance; intelligence kernel; source ingestion; entity resolution; signal engine; temporal/correlation; account intelligence; ICP/opportunity; agent intelligence; ReconOS; FadeReach; feedback/learning; console; productionization; security/privacy; reliability/scale; governance/compliance; E2E/adversarial validation; enterprise GA.
- Tinlyt remains an independently sellable Web Intelligence and Evidence Layer. Its W1–W15 foundations were reported largely merged, but exact-HEAD audit, privacy/retention/deletion, SSRF/browser assurance, unified evidence, URL redaction, outbox lifecycle, signed manifests, semantic verification, operational SRE and deployed qualification remain to be evidenced. Deep integration follows TAS completion. Social Intelligence Layer integrations must respect platform terms, licensing, user authorization and privacy.

## 3. Dependency-aware execution phases

### Phase 0 — Baseline and governance
All four repositories. Refresh default branch SHAs, PRs/issues, branch rules, required checks, workflow runs, tags, artifacts, deployments, environment configuration, migrations and external dependencies. Build an evidence ledger mapping source SHA → workflow → artifact digest → SBOM/provenance → deployment. Reconcile stale certificates and claims. Record infrastructure/cost constraints. Exit only with a reproducible exact-HEAD baseline.

### Phase 1 — Identity, foundation and tenant isolation
Tinlance + FDE Mastery + FDSE contracts. Verify Better Auth remains Tinlance's sole web auth authority; users, sessions, organizations, memberships, invitations and RBAC; server-side resource checks; tenant IDs derived from authenticated context; RLS/composite constraints; CSRF/origin/cookie/session security; service OAuth/JWT issuer, audience, key rotation, expiry, scopes, revocation and replay. Audit super-admin as a separately controlled break-glass path. Test cross-tenant reads/writes, exports, storage, jobs, events and caches. Exit with exact-SHA positive and negative tests.

### Phase 2 — M1 Commercial Engine
Tinlance. Verify assessment validation/consent/abuse limits; atomic Lead + Assessment + Opportunity + AuditEvent transaction; idempotent retry and rollback; qualification rules/versioning/human override; all opportunity transitions and concurrency; timezone-safe booking, duplicate prevention and cancellation; proposal versions, token expiry/revocation/recipient binding, acceptance and replay; engagement scope and lifecycle; Paystack signature, payload bounds, event validation, uniqueness, transactionality, refunds/chargebacks and audit; Resend retries/bounces/suppression; attribution without PII in analytics. Exit only after assessment → lead → qualification → booking → proposal → engagement → invoice passes integration tests.

### Phase 3 — Public website, SEO and 403
Tinlance. Resolve Search Console's exact affected URLs using URL Inspection, Crawl Stats, verified Googlebot request evidence and host/application logs. Attribute the 403 to its actual layer (Vercel, app middleware/auth, DNS/network or edge). Previous ordinary crawls returned 49/49 production URLs as 200 and an SEO crawl found 45/45 with no reproduced 403; this does not prove Google's request path is healthy. Apex/www were DNS-only in the prior audit, so Cloudflare HTTP proxy/WAF was not then in the request path. Preserve security; no spoofable user-agent bypass. Audit canonical host/path/query/token safety, redirects, robots, sitemap, noindex, 404/410, server-rendered content, metadata, structured data, internal links, mobile rendering, performance and CWV. Validate index-worthy routes with Google URL Inspection after deployment. Exit when legitimate pages are crawlable and eligible; indexing itself is not guaranteed.

### Phase 4 — M3 Customer Workspace
Tinlance + FDE Mastery/FDSE contracts. Reconcile the stale M3 certificate; verify project, assessment, finding, evidence, report, remediation, verification, team and activity lifecycle. Test tenant-scoped server authorization, customer/internal visibility, private storage, upload magic bytes/MIME/quotas, integrity hash, provenance, chain of custody, retention/deletion, report immutability and audit. Customer attestation must never equal independent verification. Verify evidence upload/download, findings publication, reports, remediation and cross-tenant denial in controlled production. Keep the 4 MiB cap unless a tested private multipart design is justified. Do not claim malware scanning or PDF generation unless implemented and verified. Live FDE execution is mandatory for closure.

### Phase 5 — FDE API and cross-repository execution
Tinlance + FDE Mastery + FDSE. Verify domain allowlist, service identity, tenant-context signature, audience/expiry/replay, request IDs, idempotency and upstream error handling. Exercise all eight canonical domains. Pin immutable dependency SHAs. Map execution receipts to FDSE IntegrationEvidence with deterministic hashes and lineage. Test tenant mismatch, unsupported domains, revoked identity, timeouts, malformed upstream response and retries. Browser must never bypass Tinlance's FDE API. Exit with reproducible cross-repo gate and controlled live staging execution.

### Phase 6 — Tinlance M6 MCP Gateway and M7–M10
Tinlance + FDE Mastery. Replace shallow M6 adversarial cases with actual behavior tests: tenant substitution, IDOR, disabled/ungranted tool, scope escalation, revoked agent, approval self-approval, expiry/replay, resource/parameter mismatch, race, rate-limit outage, output overflow, prompt injection, SSRF and audit tampering. Audit OAuth/JWKS cache and rotation, protocol version/initialization/notifications/errors, tool schema/version/grants, timeout/output limits, fail-closed policy composition, approval transactionality, mutating idempotency and tenant-filtered queries. Long-running tasks must use durable workflows. MCP and REST share the same core services; neither duplicates business logic or bypasses Agent Platform authority. Verify M7 security gateway, M8 eval, M9 runtime and M10 knowledge/RAG poisoning/provenance protections.

### Phase 7 — FDE Mastery production promotion
FDE Mastery. Refresh Platform Quality, SDK Quality, Continuous Evaluation and release attestation. Validate real database/queue/cache backends, migrations, OIDC, secret management, TLS, staging image, health/readiness, per-domain golden corpus, real connector contracts, shadow mode, human approval matrix, controlled actions, backup/restore, failover, RPO/RTO, SLOs, on-call and incident response. Attach SBOM, signature and provenance to exact release digest. Promote a named customer/domain only after all eight production gates pass.

### Phase 8 — FDSE M0–M18 / E1–E6 / Transformation P11–P15
FDSE + upstream Agent Platform/FDE Mastery. Refresh exact-HEAD CI. Verify M0–M18 and E1–E6 semantics, deterministic evidence graph, lineage, missing/duplicate/unknown evidence fail-closed behavior, transformation lifecycle and replication provenance. Preserve Engineering and Transformation as two first-class routes; no M19 or fifth Agent System repository. Validate TSIC against immutable FDSE/OS/SDK/Platform revisions. Verify external dependencies rather than treating contracts as deployed infrastructure. Certification verifier must not manufacture evidence.

### Phase 9 — Toolkit release and field readiness
FDSE Toolkit. Refresh functional/security/release/compatibility CI. Audit schemas, evidence hashes/provenance, secret redaction, report HTML/spreadsheet injection, package encryption, archive traversal/size limits, air-gap verification, CLI allowlist/filesystem boundaries and dependency closure. Verify source matrix continuously; separately test actual PyInstaller binaries on clean supported OS/architectures. Cut a production tag with exact hashes, SBOM, signatures and provenance. Obtain authorized field acceptance. Only then mark ENTERPRISE-CERTIFIED.

### Phase 10 — TAS completion and benchmarks
Agent System repositories and cross-repo contracts. Close FCP-02 only after the genuine eight-hour soak. Complete FCP-03 DNS/network security lab and then FCP-04–FCP-10 sequentially. Each gate needs implementation, adversarial tests, green CI, documentation and independent audit. Reconcile the exact 22 benchmark inventory. For each benchmark record product/version, capability map, evidence, gaps, license, security/privacy and independent test result. No reuse/deployment without licensing and review. Benchmark parity must cover persistent memory, tools/apps, desktop/browser actions, schedules, proactive work, multi-agent coordination, observability, safety and recovery.

### Phase 11 — Tinlyt / Social Intelligence Layer
Only after TAS gates. Finish exact-HEAD W1–W15 audit; browser isolation, SSRF and safe downloads; unified HTTP/browser evidence and chain of custody; privacy, retention, deletion and legal hold; outbox/monitor retries and idempotency; semantic verification/corroboration/conflict handling; lawful and licensed LinkedIn/X/Reddit/Google Business adapters; typed TAS integration; dedicated test runtime; staged deployment, soak, private beta and GA. Tinlyt provides evidence, Agent OS schedules, Agent Platform authorizes actions, TSIC verifies compatibility.

### Phase 12 — API, MCP, SDK and customer platform
Freeze API v1 schemas, auth, tenant context, pagination, idempotency and errors. MCP and REST call one core. Publish TypeScript/Python SDKs after contract freeze and compatibility tests. Add scoped/rotatable/revocable API identities, entitlements, usage metering and billing reconciliation. Publish OpenAPI/MCP/auth/security/SDK docs. Verify customer portal, team, audit export, reports, usage and support.

### Phase 13 — Security, privacy and incident readiness
All repos. Threat-model browser/API/MCP/agent/tool/model/memory/provider/repository/CI/evidence/customer boundaries. Map controls to OWASP ASVS 5, OWASP API Security, OWASP Agentic Applications 2026, NIST AI RMF/GenAI Profile, SSDF 1.1 and NIST incident response. Test prompt injection, SSRF, confused deputy, privilege escalation, tenant crossover, exfiltration, supply chain and identity spoofing. Verify retention/deletion/export, classification, encryption, key rotation, vulnerability SLAs, independent penetration testing and tabletop exercises.

### Phase 14 — Reliability, scale and cost
All deployed systems. Define user-facing SLO/SLI, sustained load, concurrency, queue saturation, provider outage, DB failover, backup/restore, RPO/RTO, alerting, on-call and incident runbooks. Track per-tenant model/tool costs, budgets and usage caps. Distinguish CI load samples from production capacity evidence. Confirm infrastructure costs before scaling.

### Phase 15 — Customer pilot, certification and GA
All systems. Select a controlled customer environment with written authorization, scope, exclusions and success criteria. Pin every component revision. Exercise intake → assessment → engagement → governed execution → evidence → evaluation → findings → report → remediation → independent verification → closure. Record tenant isolation, approval, rollback, incident and recovery tests. Obtain customer and technical-owner acceptance, independent security/privacy review and operational readiness review. Produce immutable certification bundle. GA is a recorded decision tied to a specific release and deployment.

## 4. Immediate work queue

1. Resolve PR #140: refresh exact head/base, review/branch protection and deployment status; do not merge while mergeability is unstable.
2. Reconcile M3 certificate with current main and current CI; keep production acceptance blockers explicit.
3. Deep-audit M6 behavior and replace label-only adversarial tests with real security tests.
4. Complete M1 transaction, concurrency, proposal, booking, engagement and payment integration audit.
5. Run controlled M3/FDE production acceptance including cross-tenant denial.
6. Refresh current exact-HEAD workflows for FDSE and Toolkit; last observed main runs were 2026-10-08.
7. Complete FDE Mastery customer/domain eight-gate evidence.
8. Complete TAS FCP-02 soak, then FCP-03; do not open FCP-04 early.
9. Complete FCP-04–FCP-10 sequentially and independently audit the 22 benchmark records.
10. Complete Tinlyt integration and Social Intelligence Layer only after TAS gates.
11. Run customer pilot and final certification/GA review.

## 5. Per-phase evidence contract

Every phase must produce: scope/threat model; exact base/head SHA and immutable dependency refs; regression tests; unit/integration/contract/adversarial/E2E evidence; lint/format/typecheck/build/migration checks; dependency/secret/SAST/DAST/container/SBOM evidence as applicable; updated README/ADR/runbook/certificate; exact workflow URLs and run IDs; deployment evidence distinct from CI; limitations/accepted risks/owner/expiry; merge commit and post-merge main verification; rollback/recovery instructions.

Skipped, neutral, cancelled, stale-SHA or unavailable checks are not GREEN. Provider failure is distinguished from code failure but still blocks a deployment gate if required evidence is missing.

## 6. External standards and sources

- OWASP Agentic Applications 2026: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- OWASP API Security: https://owasp.org/www-project-api-security/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- NIST GenAI Profile: https://doi.org/10.6028/NIST.AI.600-1
- NIST SSDF: https://csrc.nist.gov/projects/ssdf
- NIST SP 800-61 Rev. 3: https://csrc.nist.gov/pubs/sp/800/61/r3/final
- SLSA v1.2: https://slsa.dev/spec/v1.2/
- MCP specification: https://modelcontextprotocol.io/specification/
- Google crawl troubleshooting: https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors
- Google HTTP status handling: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes

Google treats 403 as a 4xx access failure and does not index the returned content. A 200 makes a page eligible for processing, not guaranteed indexing. Use Search Console Crawl Stats, URL Inspection and verified Googlebot request logs to diagnose the exact failure.

## 7. Definition of completion

100% completion requires all four repos' exact-HEAD CI/security/release workflows green and merged; no blocking PRs or stale certificates; M1 and M3 real lifecycle acceptance; M6 behavioral security and protocol conformance; FDE Mastery named customer/domain promotion; FDSE and Toolkit exact-release evidence; TAS FCP-00–FCP-10 accepted in order; licensed and independently tested benchmark parity; Tinlyt integrated without authority duplication; sustained SLO/DR/on-call evidence; a controlled customer pilot; and a final immutable certification bundle accepted for a specific deployment.

Explicit external blockers at baseline: Phase VI customer evidence (VI2), human Production Readiness Review, customer pilot acceptance, Toolkit exact-release/field evidence, TAS FCP-02 soak and FCP-03+, live M3/FDE acceptance, and refreshed FDSE/Toolkit exact-HEAD CI. These cannot be manufactured by code or synthetic tests.
