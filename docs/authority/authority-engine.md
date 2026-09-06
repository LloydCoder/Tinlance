# Tinlance Authority Engine

Status: `CURRENT_IMPLEMENTED`

## Purpose

The Authority Engine is Tinlance's public discovery, evidence, research, documentation, and content layer. It feeds the existing M1 technical-assessment and commercial workflow; it does not replace M1 or introduce autonomous publishing.

## Canonical authority boundary

```text
Search / AI discovery
        ↓
Public authority
  services / research / guides / case studies / insights / documentation
        ↓
Technical assessment
        ↓
M1 qualification / booking / proposal / engagement
        ↓
FDE / security delivery
```

Tinlance is the public commercial authority. `fde-mastery` remains the methodology and execution-platform authority where FDE technical truth is concerned.

## Implemented surfaces

- `/services` and service detail routes
- `/insights` and article routes
- `/research` and research detail routes
- `/case-studies` with evidence-gated publication
- `/guides` as a curated layer over substantive content
- `/documentation` as a public-safe orientation layer
- `/resources`
- `/assessment`
- `/llms.txt` as an optional orientation aid only
- sitemap, robots, canonical metadata, Open Graph, JSON-LD and RSS

## Content system

`apps/web/lib/content.ts` owns service and article content. `apps/web/lib/authority.ts` owns authority-specific schemas, provenance, research and case-study evidence classification. These are application source files, not user-controlled CMS input.

No database or CMS was introduced for M2 because the current publishing scale is small and repository-backed content gives the strongest reviewability, security and deployment reproducibility.

## Authority graph

The primary graph is:

`Tinlance → Services → Research / Guides / Insights / Case Studies → Assessment`

Research links to methodology, evidence and relevant services. Commercial CTAs are contextual and route into the existing `/assessment` surface.

## What M2 does not do

M2 does not implement MCP, an AI sales agent, autonomous publishing, customer RAG, an AI Security Gateway, or a new analytics platform.
