# Tinlance Legacy Site Inventory

**Audit date:** 2026-09-06  
**Legacy domain:** https://tinlance.com  
**Target repository:** https://github.com/LloydCoder/Tinlance  
**Target hosting project:** Vercel project `tinlance-hzgb` linked to `LloydCoder/Tinlance`

## Discovery method

The audit used:

- Live web crawl of `https://tinlance.com/`.
- Homepage navigation and footer link extraction.
- Search-engine discovery for indexed Tinlance URLs and ThreatFade research.
- Repository route-tree inspection.
- Existing Next.js redirect, sitemap, robots, metadata, middleware, content and asset inspection.
- Vercel project/deployment inspection.
- Public ThreatFade repository inspection.
- Public GitHub contribution evidence inspection.

The live homepage exposed the legacy PHP navigation and the following business/content areas:

- AI/cyber engineering positioning.
- Broad service catalogue.
- ThreatFade research and proof claims.
- Open-source contribution evidence.
- Articles.
- Assessment/project CTAs.
- Newsletter/brief capture.
- Product links.
- Company/legal navigation.

## Route inventory

| # | Legacy URL | Discovery source | Legacy body recovered | Final classification | Canonical destination | Final disposition |
|---:|---|---|---|---|---|---|
| 1 | `/` | live crawl | yes | A | `/` | preserve |
| 2 | `/services.php` | homepage nav | no — live fetch cache miss | B | `/services` | direct permanent redirect |
| 3 | `/work.php` | homepage nav | no — live fetch cache miss | B | `/work` | direct permanent redirect |
| 4 | `/threatfade.php` | homepage nav | no — live fetch cache miss | B | `/threatfade` | direct permanent redirect |
| 5 | `/about.php` | homepage nav | no — live fetch cache miss | B | `/about` | direct permanent redirect |
| 6 | `/blog.php` | homepage nav | no — live fetch cache miss | C | `/insights` | direct permanent redirect |
| 7 | `/blog.php?slug=threatfade-quic-c2-detection` | search index | yes, indexed article | B | `/research/threatfade-quic-c2-detection` | direct permanent redirect |
| 8 | `/blog?slug=threatfade-quic-c2-detection` | search index | yes, indexed article | B | `/research/threatfade-quic-c2-detection` | direct permanent redirect |
| 9 | `/pricing.php` | homepage footer | no — live fetch cache miss | B | `/pricing` | direct permanent redirect |
| 10 | `/faq.php` | homepage footer | no — live fetch cache miss | B | `/faq` | direct permanent redirect |
| 11 | `/client/login.php` | homepage footer | no — live fetch cache miss | E | `/sign-in` | direct permanent redirect |
| 12 | `/careers.php` | homepage footer | no — live fetch cache miss | B | `/careers` | direct permanent redirect |
| 13 | `/roadmap.php` | homepage footer | no — live fetch cache miss | B | `/roadmap` | direct permanent redirect |
| 14 | `/privacy.php` | homepage footer | no — live fetch cache miss | B | `/privacy` | direct permanent redirect |
| 15 | `/terms.php` | homepage footer | no — live fetch cache miss | B | `/terms` | direct permanent redirect |
| 16 | `/unsubscribe.php` | homepage footer | no — live fetch cache miss | E | `/unsubscribe` | direct permanent redirect |
| 17 | `/rss.php` | homepage footer | no — live fetch cache miss | E | `/feed.xml` | direct permanent redirect |
| 18 | `/changelog.php` | homepage footer | no — live fetch cache miss | C | `/changelog` | direct permanent redirect |
| 19 | `/press.php` | homepage footer | no — live fetch cache miss | B | `/press` | direct permanent redirect |
| 20 | `/partners.php` | homepage footer | no — live fetch cache miss | B | `/partners` | direct permanent redirect |
| 21 | `/sitemap-html.php` | homepage footer | no — live fetch cache miss | E | `/sitemap.xml` | direct permanent redirect |
| 22 | `/cookies.php` | homepage footer | no — live fetch cache miss | B | `/cookies` | direct permanent redirect |
| 23 | `/blog` | indexed/current legacy path evidence | no — direct fetch cache miss | C | `/insights` | direct permanent redirect |

## Crawl limitation and integrity rule

The web fetcher could not retrieve the body of the individual PHP routes and returned `Cache miss`. That is a tool-level retrieval limitation, not evidence that the legacy pages were empty or 404. The migration therefore does **not** claim to have recovered their exact body copy.

No historical text, legal wording, pricing, customer name, testimonial, benchmark methodology, or asset has been fabricated to fill that gap. Where a current replacement was required, the replacement is clearly modernized and documented as such.

## Asset inventory

The live homepage evidence exposes the current logo/branding, UI illustration, and product/research presentation, but the available crawl did not surface a reliable list of historical binary asset URLs. The current Next.js application uses controlled repository assets and does not copy arbitrary legacy implementation files.

Asset policy:

- Current logo/favicon/social assets: retained under the current app.
- Current research/article content: retained in the current route system.
- Legacy PHP/CSS/JS implementation: not migrated as technical debt.
- Unknown legacy binary assets: not falsely marked as migrated.
- Future asset recovery: use an owner-provided export or archived source, then add each asset to this inventory before import.

## SEO inventory

Current implementation includes:

- `metadataBase` at `https://tinlance.com`.
- Root title/description/Open Graph defaults.
- Generated `robots.txt` with sitemap declaration.
- Generated `sitemap.xml` containing canonical current routes only.
- Generated `feed.xml`.
- Direct permanent legacy redirects in `next.config.ts`.
- Query-specific ThreatFade redirect before generic blog redirect.
- HTTP `Link: rel=canonical` for public HTML routes via middleware, excluding API/assets/feed/sitemap/robots/protected prefixes.

## Security inventory

The migration reuses the existing application security boundary and does not introduce dynamic redirect destinations. Redirect targets are literal same-origin paths. Existing response headers retain `nosniff`, `X-Frame-Options`, HSTS, Referrer-Policy, Permissions-Policy, and CSP.

The relevant baseline is OWASP ASVS 5.0.0, which OWASP identifies as the latest stable ASVS version as of this audit.

## Vercel inventory

The current Vercel account contains exactly one project linked to `LloydCoder/Tinlance`: `tinlance-hzgb`. The latest production deployment is linked to the merged M1 commit and is `READY`. The project currently has only generated `vercel.app` domains; `tinlance.com` is not attached to the Vercel project, so DNS cutover has not occurred.

## Final classification summary

- A — Preserve: 1
- B — Transform: 14
- C — Consolidate: 3
- D — Retire: 0
- E — Redirect/replaced technical route: 4
- Total inventoried routes: 23
- Transport redirects implemented: 22
- Preserved in place: 1
- Unclassified: 0

Classification and transport are separate concepts: B/C routes are also redirected because the modern canonical implementation lives at a different URL.
