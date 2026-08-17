# Authentication & Authorization

## Status

Tinlance uses **Better Auth + Neon PostgreSQL** as its active authentication and identity architecture. Clerk is not part of the active authentication path.

## Trust model

```text
Authentication
      ↓
Session
      ↓
User
      ↓
Organization
      ↓
Membership
      ↓
Role
      ↓
Permission
      ↓
Resource
```

Authentication answers **who is this?** Authorization answers **what may this identity do within this organization?** Tenant isolation answers **which organization's resources may this identity access?** These concerns are intentionally separate.

## Persistence

The Prisma-backed Neon database is authoritative for application identity state. The architecture supports:

- users;
- sessions;
- accounts;
- verification records;
- organizations;
- memberships; and
- organization invitations.

Application records such as invoices, webhook events, audit events, projects, leads, bookings, messages, and documents use the same database boundary where their corresponding models exist.

## Sessions

Sessions are database-backed and use production-safe cookie configuration. Session lifetime and refresh behavior are configured explicitly rather than relying on an implicit browser session.

Production secrets must be supplied through the deployment environment. Authentication secrets must never be committed to source control or exposed through client bundles.

## Organizations and RBAC

The authorization model supports the following operational roles:

- **Owner** — organization ownership and highest organization-level authority.
- **Admin** — broad operational administration.
- **Security Admin** — security-sensitive operational controls.
- **Billing Admin** — billing and payment operations.
- **Operator** — permitted operational workflows without unrestricted administration.
- **Viewer** — read-only access to permitted resources.

Exact permissions are enforced server-side. A frontend route guard or hidden button is not a security control.

## Tenant isolation

Every protected application operation must resolve the authenticated user's organization membership before reading or mutating tenant-owned data.

The required sequence is:

```text
session
  ↓
user
  ↓
organization membership
  ↓
role/permission check
  ↓
organization-scoped query
  ↓
resource authorization
```

Client-supplied `organizationId` values are not trusted as authorization. The server derives the effective organization from authenticated identity and membership context, then applies the organization scope to database operations.

## FDE tenant propagation

When a permitted workflow invokes the FDE API, tenant context is propagated explicitly. The gateway validates the tenant context before forwarding execution upstream. Request IDs are propagated for audit and incident investigation.

## Migration from Clerk

The previous Clerk integration was removed from the active authentication path. The migration was designed as a controlled identity transition rather than a destructive deletion of historical identifiers. This reduces the risk of orphaned users, broken organization relationships, inaccessible historical records, and accidental account duplication.

Any remaining legacy identity identifiers should be treated as migration metadata only; they are not an authorization authority.

## Production verification

Before release, verify in the deployed environment:

1. registration and sign-in;
2. sign-out and session revocation;
3. session expiry/refresh;
4. organization membership;
5. role enforcement;
6. unauthorized resource access rejection;
7. cross-tenant access rejection;
8. admin-only operations;
9. secure cookies and HTTPS behavior; and
10. absence of server secrets from browser-delivered assets.

## Security baseline

Authentication and authorization are reviewed against OWASP ASVS 5.0 controls, with elevated scrutiny for session management, access control, tenant isolation, privileged operations, and the FDE execution boundary.
