# ADR-007: Separate solution routes from editorial content

## Status

Accepted

## Decision

Commercial solution pages live under `/services/*`, while editorial content will live under `/insights/*`. Case studies remain under `/work/*`.

## Rationale

This creates clear information architecture for both human navigation and search engines: buyers can evaluate services without mixing them with research, while the content system can later support categories, authors, reports, and monetization independently.
