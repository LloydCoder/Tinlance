import { db } from "@/lib/db";

export async function ensureOrganization(
  organizationId: string,
  name = "Tinlance Client",
) {
  return db.organization.upsert({
    where: { id: organizationId },
    create: {
      id: organizationId,
      name,
      slug: organizationId,
    },
    update: {},
  });
}

export async function requireOrganization(
  organizationId: string | null | undefined,
) {
  if (!organizationId) return null;
  return db.organization.findUnique({ where: { id: organizationId } });
}
