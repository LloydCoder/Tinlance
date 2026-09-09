import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";

export async function GET(request: Request) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.approval.read", requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "approval_authorization_denied", "Approval access denied");
  const rows = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,"agentId","agentVersionId","requestedByUserId","approvedByUserId","toolId","toolVersion","resourceType","resourceId","status","riskLevel","policyVersion","expiresAt","approvedAt","consumedAt","createdAt" FROM "McpApproval" WHERE "organizationId"=${auth.principal.organizationId} AND status IN ('PENDING','APPROVED') AND "expiresAt">CURRENT_TIMESTAMP ORDER BY "createdAt" DESC LIMIT 100`);
  return ok(request, { approvals: rows });
}
