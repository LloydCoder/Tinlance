import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function consumeStepUp(input: { token: string; organizationId: string; userId: string }) {
  if (!/^step_[A-Za-z0-9_-]{20,100}$/.test(input.token)) return false;
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "SecurityStepUp" WHERE "id"=${input.token} AND "organizationId"=${input.organizationId} AND "userId"=${input.userId} AND "expiresAt">CURRENT_TIMESTAMP AND "consumedAt" IS NULL FOR UPDATE`);
    if (!rows[0]) return false;
    await tx.$executeRaw(Prisma.sql`UPDATE "SecurityStepUp" SET "consumedAt"=CURRENT_TIMESTAMP WHERE "id"=${input.token} AND "consumedAt" IS NULL`);
    return true;
  });
}
