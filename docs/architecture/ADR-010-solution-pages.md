# ADR-010: Build solution pages as composable route-level experiences

## Status

Accepted

## Decision

Solution pages share the Tinlance design primitives but keep their page-level composition local to each route. Shared copy patterns and UI primitives can be extracted only after repeated use is demonstrated.

## Rationale

This keeps the first implementation simple while preserving a clear path to a scalable design system. Premature abstraction would make the early marketing surface harder to iterate.
