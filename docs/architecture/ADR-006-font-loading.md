# ADR-006: Keep font delivery non-blocking

## Status

Accepted

## Decision

The design system defines a sans-serif plus JetBrains Mono pairing, but production font delivery must not become a critical third-party network dependency. The implementation may use optimized local/static assets or an approved managed font pipeline after performance validation.

## Rationale

A premium engineering site should not trade first-render reliability for typography. Fonts should be optimized alongside Core Web Vitals and accessibility testing.
