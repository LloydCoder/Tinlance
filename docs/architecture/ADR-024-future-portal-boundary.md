# ADR-024: Keep the future client portal behind an explicit boundary

## Status

Accepted

## Decision

Authenticated portal surfaces will be introduced under a dedicated route group and share platform primitives with marketing pages without coupling marketing rendering to authenticated state.

## Rationale

This keeps public performance independent from future client workflows and provides a clean migration path when authentication, organizations, billing, and project data are introduced.
