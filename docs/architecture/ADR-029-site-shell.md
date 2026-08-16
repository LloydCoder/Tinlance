# ADR-029: Shared site shell owns global navigation

## Status

Accepted

## Decision

Global header, footer, metadata, and document-level concerns are composed in the root layout. Individual routes own only their page content.

## Rationale

This provides one source of truth for navigation and global SEO while keeping route components focused.
