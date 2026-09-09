import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateSecurity, recordSecurityDecision, M7_POLICY_ID, M7_POLICY_VERSION, type SecurityRequest, type SecurityDecisionResult } from "@/lib/security-gateway";

export async function enforcePersistedSecurity(input: SecurityRequest & { requestId: string }): Promise<SecurityDecisionResult> {
  const [revoked, policies] = await Promise.all([
    db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "SecurityRevocation" WHERE "organizationId"=${input.principal.organizationId} AND "principalType"=${input.principal.principalType} AND "principalId"=${input.principal.principalId} AND ("expiresAt" IS NULL OR "expiresAt">CURRENT_TIMESTAMP) LIMIT 1`),
    db.$queryRaw<Array<{ id: string; version: number }>>(Prisma.sql`SELECT p.id,COALESCE(MAX(v.version),1)::int AS version FROM "SecurityPolicy" p LEFT JOIN "SecurityPolicyVersion" v ON v."policyId"=p.id WHERE p."status"='ACTIVE' AND (p."organizationId"=${input.principal.organizationId} OR p."organizationId" IS NULL) GROUP BY p.id ORDER BY CASE WHEN p."organizationId"=${input.principal.organizationId} THEN 0 ELSE 1 END,p.priority ASC LIMIT 1`),
  ]);
  const policy = policies[0];
  const policyId = policy?.id ?? M7_POLICY_ID;
  const policyVersion = String(policy?.version ?? M7_POLICY_VERSION);
  let result: SecurityDecisionResult;
  if (revoked[0]) result = { decision: "DENY", policyId, policyVersion, reasonCode: "PRINCIPAL_REVOKED", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else if (!policy) result = { decision: "DENY", policyId, policyVersion, reasonCode: "POLICY_UNAVAILABLE", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else result = evaluateSecurity(input);
  await recordSecurityDecision({ request: input, result, requestId: input.requestId });
  return result;
}
