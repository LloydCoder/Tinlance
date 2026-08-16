# ADR-023: Avoid premature client-state dependencies

## Status

Accepted

## Decision

The initial marketing surface will not add a client-state library. Server Components, route state, Server Actions, and focused client components are sufficient until an actual cross-page state requirement exists.

## Rationale

Avoiding a global client-state dependency keeps the initial application smaller and preserves flexibility for the future authenticated portal.
