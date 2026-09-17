import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type TinlanceRole =
  | "super-admin"
  | "admin"
  | "client-admin"
  | "member"
  | "viewer";

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
      sessionId: null,
      organizationRole: null,
      role: null,
      twoFactorEnabled: false,
      isAuthenticated: false,
      isPrivileged: false,
    } as const;
  }

  // The database role and organization membership are the revocation boundary;
  // never authorize an operation from a tenant_id supplied by the caller.
  const [user, membership, mfaRows] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
    session.session.activeOrganizationId
      ? db.member.findUnique({
          where: {
            organizationId_userId: {
              organizationId: session.session.activeOrganizationId,
              userId: session.user.id,
            },
          },
          select: { role: true },
        })
      : null,
    db.$queryRaw<Array<{ twoFactorEnabled: boolean | null }>>`
      SELECT "twoFactorEnabled"
      FROM "user"
      WHERE id = ${session.user.id}
      LIMIT 1
    `,
  ]);

  const rawRole = user?.role;
  const role: TinlanceRole | null =
    typeof rawRole === "string" && allowedRoles.has(rawRole as TinlanceRole)
      ? (rawRole as TinlanceRole)
      : null;

  const activeOrganizationId = session.session.activeOrganizationId ?? null;
  const twoFactorEnabled = mfaRows[0]?.twoFactorEnabled === true;

  return {
    userId: session.user.id,
    organizationId: activeOrganizationId,
    sessionId: session.session.id,
    organizationRole: membership?.role ?? null,
    role,
    twoFactorEnabled,
    isAuthenticated: true,
    isPrivileged: role ? privilegedRoles.has(role) : false,
  } as const;
}

export async function requireAuthenticated() {
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) return null;
  return context;
}

export async function requirePrivileged(options?: { requireMfa?: boolean }) {
  const context = await getAuthorizationContext();
  const requireMfa = options?.requireMfa ?? true;
  if (!context.isAuthenticated || !context.isPrivileged) return null;
  if (requireMfa && !context.twoFactorEnabled) return null;
  return context;
}

export async function hasValidStepUp(context: Awaited<ReturnType<typeof getAuthorizationContext>>) {
  if (!context.isAuthenticated || !context.userId || !context.sessionId) return false;
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM "stepUpChallenge"
    WHERE "userId" = ${context.userId}
      AND "sessionId" = ${context.sessionId}
      AND "verifiedAt" IS NOT NULL
      AND "expiresAt" > NOW()
    ORDER BY "verifiedAt" DESC
    LIMIT 1
  `;
  return rows.length === 1;
}

export async function requirePrivilegedStepUp() {
  const context = await requirePrivileged({ requireMfa: true });
  if (!context) return null;
  if (!(await hasValidStepUp(context))) return null;
  return context;
}
