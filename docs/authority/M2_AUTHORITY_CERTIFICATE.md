# M2 Authority Engine Certificate

**Status: M2 AUTHORITY ENGINE: BLOCKED**

This certificate is intentionally blocked until the implementation branch has a successful full CI run and a successful production deployment for the final M2 commit. No completion claim is made before those gates pass.

## Scope

M2 covers public authority: technical SEO, AI discovery, entity clarity, research, case-study governance, content provenance/freshness, internal linking, documentation reconciliation and content-to-assessment conversion.

M2 does not implement MCP, autonomous publishing, customer RAG, AI sales agents, an AI Security Gateway, or a second analytics system.

## Implemented content types

- article / insight
- guide
- research
- case-study
- documentation
- resource entry point
- optional machine-readable `/llms.txt` orientation

## Public authority routes

`/services`, `/research`, `/research/threatfade-quic-c2-detection`, `/case-studies`, `/guides`, `/documentation`, `/insights`, `/resources`, `/work`, `/assessment`.

## Research evidence

ThreatFade historical MVP evidence remains preserved and explicitly scoped:

- 490,847 packets;
- real Merlin QUIC C2 traffic;
- z-score 14.76;
- 0% false positives across the tested MVP populations.

The public research page classifies these as historical MVP experiment results, not a universal production guarantee.

## Documentation audit

- Markdown documents under `docs/` at the M2 implementation baseline: **54**.
- MDX source files: **0**.
- Canonical current architecture: `docs/architecture/tinlance-architecture.md`.
- Canonical authority documentation: `docs/authority/`.
- Historical migration evidence retained under `docs/migrations/`.
- Root README reconciled.
- FDE integration documentation reconciled to the current eight-domain gateway contract.
- Historical handoff files supplied in project context remain provenance/context, not implementation truth.

## SEO checks implemented

- canonical metadata on significant authority routes;
- canonical sitemap expansion;
- robots policy for Googlebot, Bingbot, OAI-SearchBot, GPTBot and Google-Extended;
- public/private crawler boundary for `/admin/` and `/portal/`;
- Organization and WebSite JSON-LD;
- BreadcrumbList on authority pages;
- Article/BlogPosting JSON-LD for research/insights;
- Service JSON-LD on service detail pages;
- Open Graph metadata;
- RSS retained;
- M0 permanent redirects preserved.

## AI discovery checks implemented

- OAI-SearchBot is not unintentionally blocked.
- Googlebot/Bingbot/Google-Extended are explicitly allowed on public content.
- GPTBot is explicitly allowed because Tinlance has not requested an opt-out from potential training; this can be changed independently of search discovery.
- Private application paths remain disallowed to crawlers and protected by application authorization.
- `/llms.txt` is generated from canonical source data and documented as an optional orientation aid, not a ranking mechanism.
- No citation/ranking guarantee is claimed.

## Content quality checks implemented

- truth-status taxonomy;
- evidence-level taxonomy;
- author provenance;
- published/updated/reviewed dates;
- research methodology/dataset/environment/results/limitations;
- case-study evidence gate with no fabricated customer outcomes;
- structural validation tests;
- deterministic sitemap/robots tests;
- assessment CTA integration.

## Security checks

- Existing M0 redirect/open-redirect tests remain in place.
- Authority content is repository-backed rather than user-controlled.
- JSON-LD is serialized with `<` escaping before insertion.
- No arbitrary MDX execution surface was introduced.
- No authenticated tenant/customer data is exposed by the authority content model.
- Existing Semgrep, AI-security, dependency, container and SBOM gates remain unchanged.

## External research basis

M2 implementation was checked against current Google Search Central generative-AI and people-first guidance, canonicalization guidance, structured-data guidance, OpenAI publisher crawler guidance, Bing AI Performance guidance, Schema.org vocabulary, OWASP ASVS 5.0 and current OWASP GenAI/Agentic guidance.

## Blockers at certificate creation

1. The first PR CI run was cancelled during dependency installation because a newer commit superseded it; therefore no full M2 CI run is certified yet.
2. Vercel preview deployments for the branch currently return `BUILD_FAILED / Resource provisioning failed` with no build error events. This appears to be infrastructure/resource provisioning rather than a source compilation error, but production success is not yet established.
3. Production path-level verification remains pending until a successful M2 deployment exists.

## Completion rule

This certificate may only be changed to:

**M2 AUTHORITY ENGINE: COMPLETE**

after the final M2 commit has a green full CI workflow, the PR is merged, main CI is green, the corresponding Vercel production deployment is READY, and representative public authority routes/robots/sitemap/metadata/structured data/assessment CTA are verified against that deployment.
