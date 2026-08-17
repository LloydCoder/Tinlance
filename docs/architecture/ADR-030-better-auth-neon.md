# ADR-030 — Better Auth + Neon authentication

## Status

Accepted — 2026-08-17.

## Decision

Tinlance uses Better Auth as the application identity layer and Neon Postgres as the authoritative persistence layer. Prisma remains the application ORM and uses the official Better Auth Prisma adapter.

Clerk is removed from the web application authentication path. Legacy Clerk organization identifiers remain nullable during the cutover so existing tenant records can be reconciled without losing historical references.

## Security boundary

Authentication is established with Better Auth database-backed sessions. The route middleware performs an optimistic session-cookie redirect for `/portal` and `/admin`; every protected page performs a server-side session check. Authorization is enforced server-side using the persisted user role and organization membership.

Global roles are:

- `super-admin`
- `admin`
- `client-admin`
- `member`
- `viewer`

Organization roles are managed by Better Auth's Organization plugin (`owner`, `admin`, `member`) and are distinct from global administrative roles.

## Data model

Better Auth owns `User`, `Session`, `Account`, `Verification`, `Member`, and `Invitation`. Existing Tinlance business entities continue to use the same Neon Postgres database and organization primary keys.

## Operational requirements

Production deployments require:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL` matching `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_SECRET` with at least 32 high-entropy characters

Secrets must be configured in the deployment environment and never committed to source control.

## Migration note

Better Auth session identifiers are not compatible with Clerk sessions. The authentication cutover intentionally invalidates Clerk sessions. Existing Clerk users/passwords require an explicit data migration if legacy users must retain their credentials; no password hashes are fabricated or copied without verified source data.
