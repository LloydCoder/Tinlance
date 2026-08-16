# ADR-027: Green CI is the merge gate

## Status

Accepted

## Decision

A foundation change is not merged until repository CI is green. Type checking, linting, and production build validation are required for the web application.

## Rationale

The repository is part of Tinlance's technical proof. Green automation is therefore a release requirement, not an optional convenience.
