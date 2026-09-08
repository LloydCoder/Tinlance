import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function DELETE(request: Request, context: { params: Promise<{ agentId: string }> }) {
  const principal = await getWorkspacePrincipal();
  const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return new Response(JSON.stringify({ code: "FORBIDDEN", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const { agentId } = await context.params;
  const result = await db.$executeRaw(Prisma.sql`UPDATE "McpAgent" SET "status"='REVOKED',"revokedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${agentId} AND "organizationId"=${principal.organizationId} AND "status"='ACTIVE'`);
  if (result === 0) return new Response(JSON.stringify({ code: "NOT_FOUND", requestId }), { status: 404, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  await db.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action: "MCP_AGENT_REVOKED", resourceType: "McpAgent", resourceId: agentId, requestId, metadata: { reason: "operator_revocation" } } });
  return new Response(JSON.stringify({ data: { id: agentId, status: "REVOKED" }, requestId }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
}
