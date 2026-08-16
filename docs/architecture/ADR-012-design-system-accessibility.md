# ADR-012: Treat accessibility as a design-system requirement

## Status

Accepted

## Decision

Accessibility is part of the Tinlance design system, not a final QA pass. Shared components must preserve semantic HTML, keyboard access, visible focus, readable contrast, and reduced-motion behavior.

## Rationale

Enterprise buyers and users expect accessible software. Baking these constraints into primitives reduces repeated defects as the application grows.
