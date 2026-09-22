# Gate C — Tenant Integrity & Cross-Tenant Authorization

Gate C adds a database-enforced tenant consistency boundary for the customer/FDE workspace and tightens the application authorization boundary.

## Database boundary

Every workspace record anchored to a project now carries an enforced composite relationship:

`(projectId, organizationId) → Project(id, organizationId)`

This prevents a child workspace record from associating an organization with a project owned by another organization, even if an application-level authorization check is bypassed.

The migration performs a preflight consistency check before adding the constraints. Existing inconsistent data therefore blocks the migration instead of being silently repaired.

## Application boundary

Workspace project authorization is organization-scoped by default. A global `admin` role is no longer an implicit cross-tenant override. Explicit cross-tenant workspace access requires `super-admin`.

This follows the principle that privileged roles should receive only the authority explicitly required for the operation.

## Verification

Gate C includes:
- cross-tenant database write rejection;
- database constraint validation checks;
- same-tenant authorization coverage;
- ordinary-admin cross-tenant denial;
- explicit super-admin cross-tenant allowance;
- non-privileged cross-tenant denial.

PostgreSQL documents composite foreign keys as the mechanism for enforcing multi-column referential integrity, and its row-security documentation notes that database-level controls provide defense in depth beyond application predicates. OWASP recommends automated tenant-isolation and authorization regression tests for horizontal access-control failures.

Gate C deliberately does not claim PostgreSQL RLS is enabled globally: the current Prisma/Neon connection architecture does not yet establish a safe transaction-scoped tenant session context for every database operation. Enabling FORCE RLS without that context would create either outages or unsafe connection-pool behavior. This phase therefore establishes the database invariant that can be safely deployed now while preserving the existing application authorization contract.
