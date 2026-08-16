# Architecture Decision Records

## ADR-001 — Public canonical repository

**Status:** Accepted

The canonical Tinlance application repository is `LloydCoder/Tinlance`. It remains public to provide verifiable engineering evidence while proprietary reuse is not licensed.

## ADR-002 — Next.js as the web platform

**Status:** Accepted

Tinlance uses Next.js App Router and TypeScript for the primary web application, including marketing, portal, admin, and controlled API routes.

## ADR-003 — Separate FDE execution boundary

**Status:** Accepted

AI/agent execution is kept behind a separately deployable FastAPI service. This prevents AI workloads, credentials, failure modes, and Python dependencies from being tightly coupled to the web application.

## ADR-004 — Verify before release

**Status:** Accepted

Changes must pass automated type checking, linting, tests, build validation, and applicable security checks before production release.
