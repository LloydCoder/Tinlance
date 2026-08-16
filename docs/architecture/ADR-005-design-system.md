# ADR-005: Establish a shared Tinlance design system

## Status

Accepted

## Decision

Use a small set of CSS design tokens and reusable React components as the visual foundation of the Tinlance web application. Tailwind remains available for utility composition, while shared visual decisions stay centralized in tokens and documented primitives.

## Rationale

Tinlance needs a distinctive, enterprise-oriented visual language that can scale across marketing pages, client workflows, and future platform surfaces without creating a large component framework prematurely.

## Consequences

- Shared components are easier to test and evolve.
- Visual consistency is enforced through tokens.
- Page composition remains flexible.
- The system can later absorb shadcn/ui primitives where they provide accessibility value.
