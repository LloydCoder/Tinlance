# ADR-020: Server-first marketing pages

## Status

Accepted

## Decision

Public marketing pages use React Server Components by default. Browser-side state is introduced only when a user interaction requires it.

## Rationale

This keeps the initial JavaScript budget small and makes performance the default rather than an optimization task after the fact.
