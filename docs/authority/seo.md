# Technical SEO

Status: `CURRENT_IMPLEMENTED`

## Canonical URL

`https://tinlance.com` is the canonical public host. Public pages expose self-referencing canonical metadata through the existing canonical-link mechanism and Next.js metadata. Sitemap entries use canonical paths only.

## Discovery

The public discovery stack is:

- semantic HTML and stable routes;
- internal navigation and contextual links;
- `/sitemap.xml`;
- `/robots.txt`;
- `/feed.xml` for content discovery;
- JSON-LD for entity/page interpretation;
- Open Graph metadata;
- optional `/llms.txt` orientation aid.

Private application surfaces are not represented as authority content.

## Structured data

M2 uses only data represented by visible content:

- `Organization`
- `WebSite`
- `BreadcrumbList`
- `Article` / `BlogPosting`
- `Service` where page-level implementation requires it

No fake reviews, ratings, awards, FAQs, products or customer outcomes are marked up.

## Sitemap rules

The sitemap contains canonical public routes and published authority content. It excludes admin, portal, API and query variants. Content `lastModified` is based on substantive `updatedAt` values.

## Redirects

M0's legacy direct permanent redirects remain authoritative. M2 must not replace them with chains, homepage dumping or dynamic destinations.

## Metadata

Significant authority pages should provide a descriptive title, description, canonical URL, Open Graph representation and publication/update information where relevant. Titles and descriptions should describe the visible page rather than a keyword target.

## Quality principle

Technical SEO supports people-first, non-commodity content. It is not a substitute for useful research, evidence, clear entity definitions or good page experience.
