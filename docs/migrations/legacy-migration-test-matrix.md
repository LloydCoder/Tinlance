# Legacy Migration Test Matrix

Audit date: 2026-09-06

The migration contract is tested in CI and the merged main deployment is READY on Vercel. Vercel deployment protection prevents this audit connector from following the protected share cookie to individual non-root paths, so path-by-path HTTP status assertions are backed by the deterministic Next.js redirect contract tests and deployment build output rather than by disabling deployment protection.

| Legacy URL | Expected | Destination | CI contract | Deployment |
|---|---:|---|---|---|
| `/` | 200 | `/` | PASS | PASS — root 200 |
| `/services.php` | 308 | `/services` | PASS | PASS — compiled redirect contract |
| `/work.php` | 308 | `/work` | PASS | PASS — compiled redirect contract |
| `/threatfade.php` | 308 | `/threatfade` | PASS | PASS — compiled redirect contract |
| `/about.php` | 308 | `/about` | PASS | PASS — compiled redirect contract |
| `/blog.php` | 308 | `/insights` | PASS | PASS — compiled redirect contract |
| `/blog.php?slug=threatfade-quic-c2-detection` | 308 | `/research/threatfade-quic-c2-detection` | PASS | PASS — compiled query-specific redirect contract |
| `/blog?slug=threatfade-quic-c2-detection` | 308 | `/research/threatfade-quic-c2-detection` | PASS | PASS — compiled query-specific redirect contract |
| `/pricing.php` | 308 | `/pricing` | PASS | PASS — compiled redirect contract |
| `/faq.php` | 308 | `/faq` | PASS | PASS — compiled redirect contract |
| `/client/login.php` | 308 | `/sign-in` | PASS | PASS — compiled redirect contract |
| `/careers.php` | 308 | `/careers` | PASS | PASS — compiled redirect contract |
| `/roadmap.php` | 308 | `/roadmap` | PASS | PASS — compiled redirect contract |
| `/privacy.php` | 308 | `/privacy` | PASS | PASS — compiled redirect contract |
| `/terms.php` | 308 | `/terms` | PASS | PASS — compiled redirect contract |
| `/unsubscribe.php` | 308 | `/unsubscribe` | PASS | PASS — compiled redirect contract |
| `/rss.php` | 308 | `/feed.xml` | PASS | PASS — compiled redirect contract |
| `/changelog.php` | 308 | `/changelog` | PASS | PASS — compiled redirect contract |
| `/press.php` | 308 | `/press` | PASS | PASS — compiled redirect contract |
| `/partners.php` | 308 | `/partners` | PASS | PASS — compiled redirect contract |
| `/sitemap-html.php` | 308 | `/sitemap.xml` | PASS | PASS — compiled redirect contract |
| `/cookies.php` | 308 | `/cookies` | PASS | PASS — compiled redirect contract |
| `/blog` | 308 | `/insights` | PASS | PASS — compiled redirect contract |
| `/unknown-old-page.php` | 404 | — | PASS — negative route contract | PASS — current app 404 contract compiled |
| `/services.php?next=https://example.com` | 308 | `/services` | PASS — no user-controlled destination | PASS — literal destination |
| `/threatfade.php?next=javascript:alert(1)` | 308 | `/threatfade` | PASS — no user-controlled destination | PASS — literal destination |

## Chain/loop checks

- Legacy → final canonical is one hop in the Next.js redirect contract.
- Final canonical routes are not mapped back to legacy URLs.
- No redirect destination is user-controlled.
- Query strings do not alter literal redirect destinations except the explicitly allowlisted ThreatFade article slug.
- The build output confirms the final canonical route set is present in the deployed Next.js application.
