import { auth } from "@clerk/nextjs/server";

export type TinlanceRole = "super-admin" | "admin" | "client-admin" | "member" | "viewer";

const privilegedRoles = new Set<TinlanceRole>(["super-admin", "admin"]);
const allowedRoles = new Set<TinlanceRole>(["super-admin", "admin", "client-admin", "member", "viewer"]);

type ClaimsMetadata = { role?: unknown };

export async function getAuthorizationContext() {
  const session = await auth();
  const metadata = session.sessionClaims?.metadata as ClaimsMetadata | undefined;
  const role = metadata?.role;
  const normalizedRole: TinlanceRole | null =
    typeof role === "string" && allowedRoles.has(role as TinlanceRole) ? (role as TinlanceRole) : null;

  return {
    userId: session.userId,
    organizationId: session.orgId,
    organizationRole: session.orgRole,
    role: normalizedRole,
    isAuthenticated: Boolean(session.userId),
    isPrivileged: normalizedRole ? privilegedRoles.has(normalizedRole) : false,
  };
}
