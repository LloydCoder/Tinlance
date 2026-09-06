# Content Model

Status: `CURRENT_IMPLEMENTED`

## Content types

M2 supports a small taxonomy:

- `article` — editorial/technical insight.
- `guide` — curated practical guidance backed by substantive content.
- `research` — technical investigation with methodology, evidence and limitations.
- `case-study` — project outcome with explicit evidence provenance.
- `resource` — reusable public resource entry point.
- `documentation` — stable explanation of current public concepts and boundaries.
- `glossary` — only where a definition adds durable value.
- `announcement` — dated company/project update.

The implementation does not create a separate schema for every URL. File-backed content remains the source of truth.

## Truth statuses

Every significant technical statement should map to one of:

`CURRENT_IMPLEMENTED`, `CURRENT_VERIFIED`, `HISTORICAL_VERIFIED`, `EXPERIMENTAL`, `PLANNED`, `DEPRECATED`, `UNKNOWN`.

The status is a governance control. A planned or experimental item must not be represented as an implemented production capability.

## Research

Research supports:

- title and summary
- abstract
- research question
- context
- methodology
- dataset
- environment
- results
- limitations
- evidence levels
- authorship
- publication/update/review dates
- related services/research/case studies
- references
- canonical URL
- CTA

Optional fields are omitted rather than fabricated.

## Case studies

Case studies support:

- problem and context
- constraints
- approach
- architecture
- security considerations
- evidence classification
- results
- lessons and limitations
- technologies
- outcome
- authorship and review dates
- related services
- canonical URL

M2 deliberately contains no fabricated customer case study. The schema is ready, but publication is evidence-gated.

## Freshness

`publishedAt` records publication. `updatedAt` changes only after a substantive content revision. `reviewedAt` records the latest technical/editorial review. A date change is not a freshness tactic.

## Provenance

Authors are explicit records with role and expertise. Current public articles use the Tinlance Engineering organization author because no unsupported individual authorship is claimed.
