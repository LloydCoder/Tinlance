import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type TinlanceRole = "super-admin" | "admin" | "client-admin" | "member" | "viewer";

const privilegedRoles = new Set<TinlanceRole>(["super-admin", "admin"]);
const allowedRoles = new Set<TinlanceRole>([
  "super-admin",
  "admin",
  "client-admin",
  "member",
  "viewer",
]);

export async function getAuthorizationContext() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      userId: null,
      organizationId: null,
      organizationRole: null,
      role: null,
      isAuthenticated: false,
      isPrivileged: false,
    } as const;
  }

  const rawRole = (session.user as typeof session.user & { role?: unknown }).role;
  const role: TinlanceRole | null =
    typeof rawRole === "string" && allowedRoles.has(rawRole as TinlanceRole)
      ? (rawRole as TinlanceRole)
      : null;

  const activeOrganizationId = session.session.activeOrganizationId ?? null;
  const membership = activeOrganizationId
    ? await db.member.findUnique({
        where: {
          organizationId_userId: {
            organizationId: activeOrganizationId,
            userId: session.user.id,
          },
        },
        select: { role: true },
      })
    : null;

  return {
    userId: session.user.id,
    organizationId: activeOrganizationId,
    organizationRole: membership?.role ?? null,
    role,
    isAuthenticated: true,
    isPrivileged: role ? privilegedRoles.has(role) : false,
  } as const;
}

export async function requireAuthenticated() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) return null;
  return context;
}

export async function requirePrivileged() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated || !context.isPrivileged) return null;
  return context;
}
