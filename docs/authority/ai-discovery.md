# AI Discovery

Status: `CURRENT_IMPLEMENTED`

AI discovery is treated as a distribution channel, not a ranking promise.

## Objective

Make public Tinlance content crawlable, indexable, understandable, attributable, stable and evidence-backed so search and answer systems can accurately interpret and cite it.

## Crawlers

The public robots policy explicitly allows:

- Googlebot
- Bingbot
- OAI-SearchBot
- GPTBot
- Google-Extended

Admin and portal paths are disallowed to crawlers. This is an additional discovery control, not an application security boundary; those routes remain protected by the application.

OpenAI currently recommends allowing OAI-SearchBot when publishers want public content to be discoverable and cited in ChatGPT Search. GPTBot is a separate control for potential training use. Google-Extended is a separate Google robots token for Gemini training/grounding controls and does not affect Google Search inclusion or ranking.

## Machine-readable authority

The site uses semantic HTML, JSON-LD, canonical metadata, stable URLs, explicit authorship, publication/review dates, research evidence and internal relationships. `/llms.txt` is generated from canonical site data and is explicitly an optional orientation aid, not a ranking mechanism.

## No AI-search theatre

Tinlance does not claim guaranteed ChatGPT, Copilot, Google AI Overview or AI Mode citations. It does not publish hidden AI-only content, fake citations, entity spam, or keyword permutations.

## Measurement

AI citation activity should be treated as an observed metric. Where first-party tooling is available, record URL, AI surface, query/topic and date. Bing AI Performance citation counts and grounding queries are visibility observations, not conventional ranking or authority scores.
