import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function getAgentDetails(organizationId: string, agentId: string) {
  const agent = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT "id","organizationId","ownerUserId","clientId","name","description","status","environment","runtimeEnabled","expiresAt","runtimeExpiresAt","createdAt","updatedAt" FROM "McpAgent" WHERE id=${agentId} AND "organizationId"=${organizationId} LIMIT 1`);
  if (!agent[0]) return null;
  const versions = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,version,status,"modelProvider",model,"configuration","capabilities","memoryPolicy","executionPolicy","riskPolicy","configurationHash","createdAt" FROM "AgentVersion" WHERE "agentId"=${agentId} AND "organizationId"=${organizationId} ORDER BY version DESC`);
  return { agent: agent[0], versions };
}
