# ADR-019: Keep design tokens centralized

## Status

Accepted

## Decision

Core visual tokens are defined in the web application's global stylesheet and documented in `docs/design-system.md`. Components consume tokens rather than hard-coding brand values.

## Rationale

Centralized tokens make future brand iteration predictable and reduce visual drift across routes.
