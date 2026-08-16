# ADR-025: Keep FDE execution outside the marketing application

## Status

Accepted

## Decision

The future FDE Mastery engine remains a separately deployable service. The Next.js application communicates with it through authenticated service boundaries rather than embedding agent execution into the web runtime.

## Rationale

Agent execution has different runtime, scaling, security, and observability requirements from a public web application. Keeping the boundary explicit protects both systems as they evolve.
