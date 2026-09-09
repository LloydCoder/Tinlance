import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";
import { authorizeAgentManagement } from "@/lib/agent-runtime/authorization";

export async function POST(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const auth = await authenticateApi(request); if ("response" in auth) return auth.response; const requestId = getRequestId(request); const { approvalId } = await context.params; const body = await request.json().catch(() => null) as { decision?: "APPROVE" | "REJECT" } | null;
  if (!body?.decision) return problem(requestId, 400, "invalid_approval_decision", "Decision must be APPROVE or REJECT");
  const decision = await authorizeAgentManagement({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, action: "agent.approval.decide", resourceId: approvalId, requestId }); if (decision.decision !== "ALLOW") return problem(requestId, 403, "approval_authorization_denied", "Approval decision denied");
  try {
    await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; requestedByUserId: string; status: string; expiresAt: Date; agentId: string; agentVersionId: string | null; toolId: string; toolVersion: string; parameterHash: string }>>(Prisma.sql`SELECT id,"requestedByUserId",status,"expiresAt","agentId","agentVersionId","toolId","toolVersion","parameterHash" FROM "McpApproval" WHERE id=${approvalId} AND "organizationId"=${auth.principal.organizationId} FOR UPDATE`);
      const approval = rows[0]; if (!approval) throw new Error("approval_not_found"); if (approval.status !== "PENDING" || approval.expiresAt <= new Date()) throw new Error("approval_expired_or_decided"); if (approval.requestedByUserId === auth.principal.userId) throw new Error("approval_self_approval_forbidden");
      const changed = await tx.$executeRaw(Prisma.sql`UPDATE "McpApproval" SET status=${body.decision === "APPROVE" ? "APPROVED" : "REJECTED"},"approvedByUserId"=${auth.principal.userId},"approvedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${approvalId} AND status='PENDING'`); if (changed !== 1) throw new Error("approval_replay");
      await tx.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: body.decision === "APPROVE" ? "M9_APPROVAL_APPROVED" : "M9_APPROVAL_REJECTED", resourceType: "McpApproval", resourceId: approvalId, requestId, metadata: { agentId: approval.agentId, agentVersionId: approval.agentVersionId, toolId: approval.toolId, toolVersion: approval.toolVersion, parameterHash: approval.parameterHash } } });
    });
  } catch (error) { return problem(requestId, 409, "approval_decision_failed", "Approval could not be decided", error instanceof Error ? error.message : "Unknown error"); }
  return ok(request, { approvalId, status: body.decision === "APPROVE" ? "APPROVED" : "REJECTED" });
}
