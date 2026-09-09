import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { evaluateSecurity, recordSecurityDecision, M7_POLICY_ID, M7_POLICY_VERSION, type SecurityRequest, type SecurityDecisionResult } from "@/lib/security-gateway";
import { consumeStepUp, hasValidStepUp } from "@/lib/security-gateway/step-up";

export async function enforcePersistedSecurity(input: SecurityRequest & { requestId: string; stepUpToken?: string }): Promise<SecurityDecisionResult> {
  const [revoked, policies, stepUpPresent] = await Promise.all([
    db.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "SecurityRevocation" WHERE "organizationId"=${input.principal.organizationId} AND "principalType"=${input.principal.principalType} AND "principalId"=${input.principal.principalId} AND ("expiresAt" IS NULL OR "expiresAt">CURRENT_TIMESTAMP) LIMIT 1`),
    db.$queryRaw<Array<{ id: string; version: number }>>(Prisma.sql`SELECT p.id,COALESCE(MAX(v.version),1)::int AS version FROM "SecurityPolicy" p LEFT JOIN "SecurityPolicyVersion" v ON v."policyId"=p.id WHERE p."status"='ACTIVE' AND (p."organizationId"=${input.principal.organizationId} OR p."organizationId" IS NULL) GROUP BY p.id ORDER BY CASE WHEN p."organizationId"=${input.principal.organizationId} THEN 0 ELSE 1 END,p.priority ASC LIMIT 1`),
    input.stepUpToken && input.principal.userId ? hasValidStepUp({ token: input.stepUpToken, organizationId: input.principal.organizationId, userId: input.principal.userId }) : Promise.resolve(false),
  ]);
  const policy = policies[0];
  const policyId = policy?.id ?? M7_POLICY_ID;
  const policyVersion = String(policy?.version ?? M7_POLICY_VERSION);
  let result: SecurityDecisionResult;
  if (revoked[0]) result = { decision: "DENY", policyId, policyVersion, reasonCode: "PRINCIPAL_REVOKED", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else if (!policy) result = { decision: "DENY", policyId, policyVersion, reasonCode: "POLICY_UNAVAILABLE", risk: { score: 100, level: "CRITICAL" }, approvalRequired: false, stepUpRequired: false };
  else { const evaluated = evaluateSecurity({ ...input, stepUpPresent: input.stepUpPresent || stepUpPresent }); result = { ...evaluated, policyId, policyVersion }; }
  if (result.decision === "ALLOW" && input.stepUpToken && input.principal.userId && (result.risk.level === "HIGH" || result.risk.level === "CRITICAL")) {
    const consumed = await consumeStepUp({ token: input.stepUpToken, organizationId: input.principal.organizationId, userId: input.principal.userId });
    if (!consumed) result = { ...result, decision: "DENY", reasonCode: "STEP_UP_REPLAY_OR_EXPIRED" };
  }
  await recordSecurityDecision({ request: input, result, requestId: input.requestId });
  return result;
}
