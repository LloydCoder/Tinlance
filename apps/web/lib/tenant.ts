import { db } from "@/lib/db";

export async function ensureOrganization(
  organizationId: string | null | undefined,
  userId: string,
) {
  if (!organizationId) return null;

  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: { organization: true },
  });

  return membership?.organization ?? null;
}

export async function requireOrganization(
  organizationId: string | null | undefined,
  userId: string,
) {
  if (!organizationId) return null;

  const membership = await db.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: { organization: true },
  });

  return membership?.organization ?? null;
}
