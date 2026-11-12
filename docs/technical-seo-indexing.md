# Technical SEO and Google indexing policy

Last reviewed: 2026-11-12

## Canonical host

- The public canonical host is `https://www.tinlance.com`.
- The apex host `https://tinlance.com` permanently redirects to the canonical host.
- Public HTML routes must emit a self-referencing canonical URL.
- Page-level canonical metadata must override neither the canonical path nor the canonical host.
- Structured-data URLs and entity references must use the same canonical host.

## Indexable public surface

The sitemap contains public, useful pages only. Add a route when it has unique user value, a stable canonical URL, useful server-rendered content, and an internal discovery path.

Public service, product, engineering, industry, research, insight, guide, and API documentation pages may be indexed when their content is ready.

Do not add these routes to the sitemap:
- Sign-in and sign-up flows.
- Customer onboarding, proposal, and payment-token pages.
- Payment callbacks and unsubscribe flows.
- Authenticated portal and admin routes.
- API endpoints and machine-readable OpenAPI documents.
- Empty or placeholder content that is not useful as a search landing page.

The case-studies landing page remains available to users but is noindex until publishable customer case studies exist. Published case-study detail pages can be added through the evidence-backed case-study registry.

## Crawler policy

The generated `/robots.txt` allows legitimate search and discovery crawlers to access public content. It disallows the private application namespaces:

- `/admin`
- `/portal`

API and machine-readable OpenAPI endpoints remain crawlable only so crawlers can observe their `X-Robots-Tag: noindex, nofollow` response directive. They are not listed in the sitemap. The public `/docs/api` HTML documentation page remains indexable; the JSON contract is available to developers but is not a search landing page.

Robots directives are crawl controls, not access controls. Authentication and server-side authorization remain authoritative.

Authentication, tokenized customer workflows, unsubscribe, and empty case-study pages use page-level noindex metadata. Do not use robots.txt to hide a URL that must be crawled for Google to observe a noindex directive.

## Redirect policy

Legacy service routes permanently redirect to the current canonical service or product page. Avoid soft-404 placeholder pages, duplicate service content, and redirect chains.

## Structured data

Use only schema types supported by the page content:
- Organization and WebSite for the company entity.
- BreadcrumbList where the page has a meaningful hierarchy.
- Service for actual service detail pages.
- Article or BlogPosting for substantive research and insight content.
- ItemList where a real list of items is rendered.

Structured data must describe visible page content. Do not add ratings, reviews, customer outcomes, certifications, or FAQ markup that the page does not substantiate.

## 403 incident response

A Search Console 403 report is a URL-level access failure, not proof that Cloudflare is the source.

1. Retrieve the exact affected URLs from Search Console's Page indexing report.
2. Run URL Inspection on representative affected URLs and compare the live test with the last crawl.
3. Review Crawl Stats host availability and server/request logs for the same timestamps.
4. Identify the layer that generated the 403: Vercel edge/WAF, reverse proxy, Next.js middleware, route handler, or upstream service.
5. Verify that the requester is Googlebot using Google's published IP ranges or reverse DNS. Do not trust a user-agent string alone.
6. Repair only the responsible rule or route. Never disable WAF, bot protection, rate limits, or authentication globally to make crawling work.
7. Retest the exact URL and confirm that public pages return HTTP 200 while private routes and APIs remain protected.

If Cloudflare DNS records are DNS-only, Cloudflare's HTTP proxy/WAF is not in the request path for those hostnames. Verify the current proxy state before changing Cloudflare security settings.

## Verification record — 2026-11-12

- A production crawl of 49 discovered URLs returned HTTP 200 for all 49.
- `/robots.txt` and `/sitemap.xml` returned HTTP 200.
- The ordinary crawler did not reproduce the Search Console 403 report.
- This crawl does not emulate Google's verified crawler and does not prove the 403 incident is resolved.
- The exact affected URLs and Google URL Inspection results are required before changing any edge-security policy.
