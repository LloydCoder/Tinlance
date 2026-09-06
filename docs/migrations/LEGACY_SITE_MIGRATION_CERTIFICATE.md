# Tinlance Legacy-Site Migration Certificate

**Audit date:** 2026-09-06  
**Legacy domain:** https://tinlance.com  
**Current application:** `LloydCoder/Tinlance`  
**Vercel project:** `tinlance-hzgb`  
**Migration scope:** discovery + implementation + verification; DNS cutover explicitly excluded.

## Certification status

**PASS**

## Discovery

- Definitive inventoried legacy routes: **23**.
- A — Preserve: **1**.
- B — Transform: **14**.
- C — Consolidate: **3**.
- D — Retire: **0**.
- E — Redirect/replaced technical route: **4**.
- Transport redirects implemented: **22**.
- Unclassified routes: **0**.
- Unresolved routing dispositions: **0**.

The live legacy homepage, navigation/footer links, indexed search evidence, repository route tree, SEO implementation, Vercel project and current ThreatFade repository were reconciled. Individual legacy PHP endpoint bodies returned cache misses to the audit fetcher, so their exact historical copy is **not** represented as recovered. This is explicitly documented in `legacy-site-inventory.md`; no unsupported historical copy was fabricated.

## Content

- Strategic content coverage: **PASS**.
- Current positioning intentionally reconciled from the legacy broad-service model to the current AI Engineering / FDE / AI Security / Enterprise Automation architecture.
- Legacy legal, commercial, research, blog, company and proof routes each have a documented final disposition.
- Missing-content result: **no unresolved canonical route or strategic content category**. Exact body-level recovery for inaccessible legacy PHP pages remains an archival limitation, not an invented migration claim.
- Asset result: current controlled assets are preserved; legacy implementation CSS/JS is not copied; unknown legacy binaries are not falsely marked migrated.

## Claims

Historical ThreatFade evidence is preserved and contextualized:

- approximately **490,847 packets**;
- **real Merlin QUIC C2 traffic**;
- **z-score 14.76**;
- **0% false positives across the tested MVP populations**.

The canonical ThreatFade pages label these as **early MVP/historical experimental validation**, not universal current production guarantees. Current repository capabilities are separately classified from historical benchmark results.

Historical open-source contribution evidence is retained as contribution history, with time-sensitive GitHub star counts treated as dated/historical rather than permanent facts.

## SEO

- Legacy PHP/query routes use direct permanent Next.js redirects.
- Query-specific ThreatFade redirect precedes the generic blog redirect.
- No legacy route is redirected to `/` merely as a catch-all.
- Canonical links are emitted as controlled HTTP `Link` headers for public HTML routes.
- Canonical current URLs are represented in the generated sitemap.
- Robots configuration exposes sitemap discovery and does not block canonical public routes.
- Root deployment verification observed `200`, correct title/description/robots/Open Graph metadata, and `Link: <https://tinlance.com/>; rel="canonical"`.
- Build output confirms `/sitemap.xml`, `/robots.txt`, `/feed.xml`, all canonical informational routes, research route, service routes and application routes are generated.

## Security

Migration-specific regression tests cover:

- required legacy route coverage;
- duplicate mapping detection;
- same-origin destination enforcement;
- no homepage dumping;
- permanent redirect semantics;
- query-specific redirect precedence;
- no user-controlled destination;
- open-redirect attempts using external URLs and `javascript:` payloads;
- negative unknown-route contract.

Existing CI also passed AI security regression, Semgrep static security scanning, dependency audit, container hardening/scanning, SBOM validation, and the enterprise CI gate.

The migration uses the OWASP ASVS 5.0.0 baseline and introduces no dynamic redirect destination.

## CI/CD

- Implementation PR: **#56**.
- PR state: **merged and closed**.
- Merge commit: `59d84bc8cbc1dfac8903c844b77aace2830159e3`.
- Main branch verified at the merge commit.
- Main CI run: **1008 / run `34028344243` — SUCCESS**.
- Web application: PASS.
- Typecheck: PASS.
- Lint: PASS.
- Tests: PASS.
- Formatting: PASS.
- Dependency audit: PASS.
- Build: PASS.
- Static security: PASS.
- AI security regression: PASS.
- FDE API: PASS.
- Container validation: PASS.
- SBOM: PASS.
- Enterprise CI gate: PASS.

## Vercel

- Existing project reused: **`tinlance-hzgb`**.
- No second Vercel project created.
- Main production deployment for merge commit: **READY**.
- Deployment: `dpl_5i1gbjAQsBU3WY6fRckgCsMCUMkx`.
- Deployment target: `production`.
- Deployment URL: `tinlance-hzgb-9cxj8x9sf-lloydcoders-projects.vercel.app`.
- Build completed successfully; generated route output was inspected.
- Production runtime error query for the deployment returned **no error/fatal logs** during the verification window.
- Vercel deployment protection prevented the audit connector from following the protected share cookie for individual non-root path requests. This did **not** weaken or disable protection; path-level redirect verification therefore relies on the deterministic redirect tests plus compiled deployment output. Root production response was directly verified as `200` with the expected metadata and canonical link header.

## DNS

**DNS CUTOVER NOT PERFORMED.**

The Vercel project has only its generated `vercel.app` domains. `tinlance.com` is not attached to the Vercel project. The legacy origin remains untouched.

## Final safety gates

- No DNS changes: **PASS**.
- No nameserver/registrar changes: **PASS**.
- No old-host shutdown: **PASS**.
- No second Vercel project: **PASS**.
- No open PRs in Tinlance after merge: **PASS**.
- No P0/P1 migration blocker identified: **PASS**.

## Governing conclusion

The migration layer preserves the strategically important legacy Tinlance information and historical ThreatFade evidence while moving canonical routing, SEO signals, legal/navigation paths, and commercial entry points into the current Next.js application. Historical experiments are explicitly scoped so they are not represented as universal current production guarantees.

**LEGACY MIGRATION DISCOVERY: COMPLETE**
