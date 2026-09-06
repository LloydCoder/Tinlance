# Legacy Migration Test Matrix

This is the deterministic route contract for the legacy migration. The final PASS state requires the same matrix to be exercised against the candidate deployment.

| Legacy URL | Expected | Destination | Static contract | Deployment verification |
|---|---:|---|---|---|
| `/` | 200 | `/` | PASS | pending candidate |
| `/services.php` | 308 | `/services` | PASS | pending candidate |
| `/work.php` | 308 | `/work` | PASS | pending candidate |
| `/threatfade.php` | 308 | `/threatfade` | PASS | pending candidate |
| `/about.php` | 308 | `/about` | PASS | pending candidate |
| `/blog.php` | 308 | `/insights` | PASS | pending candidate |
| `/blog.php?slug=threatfade-quic-c2-detection` | 308 | `/research/threatfade-quic-c2-detection` | PASS | pending candidate |
| `/blog?slug=threatfade-quic-c2-detection` | 308 | `/research/threatfade-quic-c2-detection` | PASS | pending candidate |
| `/pricing.php` | 308 | `/pricing` | PASS | pending candidate |
| `/faq.php` | 308 | `/faq` | PASS | pending candidate |
| `/client/login.php` | 308 | `/sign-in` | PASS | pending candidate |
| `/careers.php` | 308 | `/careers` | PASS | pending candidate |
| `/roadmap.php` | 308 | `/roadmap` | PASS | pending candidate |
| `/privacy.php` | 308 | `/privacy` | PASS | pending candidate |
| `/terms.php` | 308 | `/terms` | PASS | pending candidate |
| `/unsubscribe.php` | 308 | `/unsubscribe` | PASS | pending candidate |
| `/rss.php` | 308 | `/feed.xml` | PASS | pending candidate |
| `/changelog.php` | 308 | `/changelog` | PASS | pending candidate |
| `/press.php` | 308 | `/press` | PASS | pending candidate |
| `/partners.php` | 308 | `/partners` | PASS | pending candidate |
| `/sitemap-html.php` | 308 | `/sitemap.xml` | PASS | pending candidate |
| `/cookies.php` | 308 | `/cookies` | PASS | pending candidate |
| `/blog` | 308 | `/insights` | PASS | pending candidate |
| `/unknown-old-page.php` | 404 | — | negative contract | pending candidate |
| `/services.php?next=https://example.com` | 308 | `/services` | open-redirect negative | pending candidate |
| `/threatfade.php?next=javascript:alert(1)` | 308 | `/threatfade` | open-redirect negative | pending candidate |

## Chain/loop checks

- Legacy → final canonical must be one hop.
- Final canonical must not redirect back to a legacy URL.
- No redirect destination is user-controlled.
- Query strings do not alter literal redirect destinations except the explicitly allowlisted ThreatFade article slug.
