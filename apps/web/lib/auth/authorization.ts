import { auth } from "@clerk/nextjs/server";

export type TinlanceRole = "super-admin" | "admin" | "client-admin" | "member" | "viewer";

const privilegedRoles = new Set<TinlanceRole>(["super-admin", "admin"]);

export async function getAuthorizationContext() {
  const session = await auth();
  const role = session.sessionClaims?.metadata?.role;
  const normalizedRole: TinlanceRole | null =
    typeof role === "string" && ["super-admin", "admin", "client-admin", "member", "viewer"].includes(role)
      ? (role as TinlanceRole)
      : null;

  return {
    userId: session.userId,
    organizationId: session.orgId,
    organizationRole: session.orgRole,
    role: normalizedRole,
    isAuthenticated: Boolean(session.userId),
    isPrivileged: normalizedRole ? privilegedRoles.has(normalizedRole) : false,
  };
}
