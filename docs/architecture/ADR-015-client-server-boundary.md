# ADR-015: Keep the marketing surface server-first

## Status

Accepted

## Decision

The Tinlance marketing surface remains server-first. Client components are introduced only where interaction requires browser state, animation, or event handling.

## Rationale

This reduces JavaScript shipped to visitors, improves performance, and creates a clean boundary for the future authenticated portal.
