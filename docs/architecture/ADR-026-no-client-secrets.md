# ADR-026: No secrets in the public repository

## Status

Accepted

## Decision

The public repository contains only source, documentation, tests, and non-sensitive configuration. Credentials, tokens, client data, and production configuration remain in managed secret stores.

## Rationale

Public-by-design engineering requires a strict separation between demonstrable implementation and operational secrets.
