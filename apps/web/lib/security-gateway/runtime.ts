import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateSecurity, recordSecurityDecision, M7_POLICY_ID, M7_POLICY_VERSION, type SecurityRequest, type SecurityDecisionResult } from "@/lib/security-gateway";

export async function enforcePersistedSecurity(input: SecurityRequest & { requestId: string }): Promise<SecurityDecisionResult> {
  const [revoked, policy] = await Promise.all([
    db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "SecurityRevocation" WHERE "organizationId"=${input.principal.organizationId} AND "principalType"=${input.principal.principalType} AND "principalId"=${input.principal.principalId} AND ("expiresAt" IS NULL OR "expiresAt">CURRENT_TIMESTAMP) LIMIT 1`),
    db.$queryRaw<Array<{ id: string; status: string }>>(Prisma.sql`SELECT "id","status" FROM "SecurityPolicy" WHERE "id"=${M7_POLICY_ID} AND "status"='ACTIVE' LIMIT 1`),
  ]);
  let result: SecurityDecisionResult;
  if (revoked[0]) result = { decision: "DENY", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "PRINCIPAL_REVOKED", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else if (!policy[0]) result = { decision: "DENY", policyId: M7_POLICY_ID, policyVersion: M7_POLICY_VERSION, reasonCode: "POLICY_UNAVAILABLE", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else result = evaluateSecurity(input);
  await recordSecurityDecision({ request: input, result, requestId: input.requestId });
  return result;
}
