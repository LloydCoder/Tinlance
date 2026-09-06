# Tinlance Legacy Content Matrix

Audit date: 2026-09-06

## Discovery evidence

The live `https://tinlance.com/` homepage was crawlable during the audit and exposed the legacy PHP navigation, company positioning, services, ThreatFade evidence, proof-of-work claims, article index, commercial CTAs, newsletter CTA, product links, and footer/legal navigation. Search indexing also exposed the ThreatFade article at `https://tinlance.com/blog?slug=threatfade-quic-c2-detection`.

The individual PHP endpoints listed in the homepage navigation returned `Cache miss` to the audit web fetcher rather than a usable page body. They are therefore treated as **discovered routes**, not as fully recovered page bodies. No unsupported historical page copy has been reconstructed from inference.

Google's current migration guidance requires an old→new URL map, direct permanent redirects, updated canonicals/internal links/sitemaps, and redirect testing. The implementation follows that model. See https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes.

## Coverage matrix

| Legacy area | Observed evidence | Current destination | Classification | Coverage decision |
|---|---|---|---|---|
| Homepage | Live crawl: company positioning, service catalogue, ThreatFade, proof, articles, CTAs | `/` | A — Preserve | Modern homepage intentionally keeps the strategic AI/FDE/security positioning; stale zero-valued metrics are not carried forward. |
| Services | Homepage exposes broad service catalogue and `/services.php` | `/services` | B — Transform | Current four-service architecture is canonical; legacy disciplines are retained as historical discovery evidence and not automatically restored as offers. |
| Work | Homepage links to `/work.php` and proof-of-work section | `/work` | B — Transform | Proof is preserved in current work architecture. |
| ThreatFade | Homepage contains research/evidence section and `threatfade.php` link | `/threatfade` + research route | B — Transform | Historical MVP evidence retained with scoped wording. |
| About | Footer links to `/about.php` | `/about` | B — Transform | Current company page is canonical. |
| Blog | Footer links to `/blog.php`; indexed query-string article exists | `/insights` + `/research/...` | C/B — Consolidate/Transform | Index consolidated; known ThreatFade article mapped directly. |
| Pricing | Footer links to `/pricing.php` | `/pricing` | B — Transform | Assessment-led pricing model; no unsupported historical rate card invented. |
| FAQ | Footer links to `/faq.php` | `/faq` | B — Transform | Current process/security/engagement FAQ. |
| Client login | Footer links to `/client/login.php` | `/sign-in` | E — Redirect | Replaced by Better Auth. |
| Careers | Footer links to `/careers.php` | `/careers` | B — Transform | Route retained without inventing vacancies. |
| Roadmap | Footer links to `/roadmap.php` | `/roadmap` | B — Transform | Public direction retained; internal delivery dates not fabricated. |
| Privacy | Footer links to `/privacy.php` | `/privacy` | B — Transform | Current data-flow-oriented privacy boundary. |
| Terms | Footer links to `/terms.php` | `/terms` | B — Transform | Current website/engagement boundary; executed agreements control commercial terms. |
| Unsubscribe | Footer links to `/unsubscribe.php` | `/unsubscribe` | E — Redirect | Dedicated route retained. |
| RSS | Footer links to `/rss.php` | `/feed.xml` | E — Redirect | Existing canonical RSS implementation reused. |
| Changelog | Footer links to `/changelog.php` | `/changelog` | C — Consolidate | Public change history retained; research stays under insights/research. |
| Press | Footer links to `/press.php` | `/press` | B — Transform | Current company/media information without unsupported claims. |
| Partners | Footer links to `/partners.php` | `/partners` | B — Transform | Current partnership model. |
| HTML sitemap | Footer links to `/sitemap-html.php` | `/sitemap.xml` | E — Redirect | Machine-readable sitemap is canonical; duplicate HTML sitemap not needed. |
| Cookies | Footer links to `/cookies.php` | `/cookies` | B — Transform | Current application cookie/storage boundary. |

## Current positioning reconciliation

The legacy site is substantially broader than the current Tinlance positioning. It advertises AI startups, cybersecurity startups, DeepTech, fintech, open source, outsourcing, web/app development, data engineering, blockchain/Web3, DevOps/cloud, due diligence, fractional CTO, UI/UX, and staff augmentation.

The current repository deliberately concentrates the canonical service architecture on:

- AI Engineering
- AI Security
- Forward-Deployed Engineering
- Enterprise Automation

This is an intentional consolidation, not accidental content loss. The migration does **not** silently convert every historical discipline into a current offer. Historical positioning remains documented here so it is not erased from the company's record.

## Content status

- **Preserved:** strategic company identity, engineering/security orientation, ThreatFade research identity, open-source contribution evidence, commercial assessment pathway, legal/navigation intent.
- **Improved:** canonical URL architecture, assessment-led conversion, security boundaries, metadata/sitemap/robots, and public informational routes.
- **Consolidated:** legacy blog index → insights; changelog remains a dedicated current route while research uses canonical research URLs.
- **Missing exact legacy body:** individual PHP page bodies could not be recovered by the live fetcher during this audit. No invented historical copy is presented as recovered content.
- **Needs owner decision:** none for routing. Exact historical copy can be re-imported later if a source archive/export is provided; the canonical migration does not depend on inventing it.

## Asset status

The current application uses its own controlled SVG/Next assets and does not copy arbitrary legacy JavaScript/CSS implementation. The live homepage exposed no indexed PDF/download corpus in the available search evidence. No legacy binary asset has been silently claimed as migrated.

## CTA/form status

The live homepage exposes `Start a project`, `Start a project →`, a one-line brief, and newsletter subscription controls. The current application replaces the legacy generic commercial entry point with the assessment/contact architecture and does not create a second lead system.

## Legal status

Privacy, terms, cookies, and unsubscribe remain first-class routes. The new pages describe the current application boundary and explicitly avoid pretending that unknown historical legal wording has been recovered.
