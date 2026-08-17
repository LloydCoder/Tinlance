import { db } from "@/lib/db";

export async function ensureOrganization(
  clerkOrgId: string,
  name = "Tinlance Client",
) {
  return db.organization.upsert({
    where: { clerkOrgId },
    create: { clerkOrgId, name },
    update: { name },
  });
}

export async function requireOrganization(
  clerkOrgId: string | null | undefined,
) {
  if (!clerkOrgId) return null;
  return db.organization.findUnique({ where: { clerkOrgId } });
}
