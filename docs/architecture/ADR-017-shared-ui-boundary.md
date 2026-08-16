# ADR-017: Keep shared UI primitives small

## Status

Accepted

## Decision

Shared UI components are limited to patterns used across multiple routes. Marketing pages may compose those primitives locally until repetition justifies extraction.

## Rationale

A small component boundary reduces coupling and avoids building a large internal framework before the product surface is understood.
