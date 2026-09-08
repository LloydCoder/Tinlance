import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const json = (body: unknown, status: number, requestId: string, cache = "no-store") => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache, "x-request-id": requestId } });

export async function GET(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const principal = await getWorkspacePrincipal(); const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return json({ code: "FORBIDDEN", requestId }, 403, requestId);
  const { approvalId } = await context.params;
  const rows = await db.$queryRaw<Array<{ id: string; agentId: string; requestedByUserId: string; approvedByUserId: string | null; toolId: string; toolVersion: string; resourceType: string | null; resourceId: string | null; parameterHash: string; status: string; expiresAt: Date; approvedAt: Date | null; consumedAt: Date | null; createdAt: Date }>>(Prisma.sql`SELECT "id","agentId","requestedByUserId","approvedByUserId","toolId","toolVersion","resourceType","resourceId","parameterHash","status","expiresAt","approvedAt","consumedAt","createdAt" FROM "McpApproval" WHERE "id"=${approvalId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  const row = rows[0]; if (!row) return json({ code: "NOT_FOUND", requestId }, 404, requestId);
  return json({ data: { ...row, expiresAt: row.expiresAt.toISOString(), approvedAt: row.approvedAt?.toISOString() ?? null, consumedAt: row.consumedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), parameterHash: undefined }, requestId }, 200, requestId, "private, no-store");
}

export async function POST(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const principal = await getWorkspacePrincipal(); const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return json({ code: "FORBIDDEN", requestId }, 403, requestId);
  const body = (await request.json().catch(() => null)) as { decision?: string } | null;
  const decision = body?.decision === "APPROVE" || body?.decision === "REJECT" ? body.decision : null;
  if (!decision) return json({ code: "INVALID_ARGUMENT", requestId }, 422, requestId);
  const { approvalId } = await context.params;
  try {
    await db.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; requestedByUserId: string; status: string; expiresAt: Date; agentId: string; toolId: string; toolVersion: string }>>(Prisma.sql`SELECT "id","requestedByUserId","status","expiresAt","agentId","toolId","toolVersion" FROM "McpApproval" WHERE "id"=${approvalId} AND "organizationId"=${principal.organizationId} FOR UPDATE`);
      const row = rows[0];
      if (!row || row.status !== "PENDING" || row.expiresAt <= new Date()) throw new Error("approval_not_pending");
      if (row.requestedByUserId === principal.userId) throw new Error("approval_self_approval_forbidden");
      const changed = await tx.$executeRaw(Prisma.sql`UPDATE "McpApproval" SET "status"=${decision === "APPROVE" ? "APPROVED" : "REJECTED"},"approvedByUserId"=${principal.userId},"approvedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${approvalId} AND "status"='PENDING'`);
      if (changed !== 1) throw new Error("approval_replay");
      await tx.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action: decision === "APPROVE" ? "MCP_APPROVAL_APPROVED" : "MCP_APPROVAL_REJECTED", resourceType: "McpApproval", resourceId: approvalId, requestId, metadata: { agentId: row.agentId, toolId: row.toolId, toolVersion: row.toolVersion, requestedByUserId: row.requestedByUserId } } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "approval_self_approval_forbidden") return json({ code: "FORBIDDEN", detail: "The requester cannot approve its own agent action", requestId }, 403, requestId);
    return json({ code: "CONFLICT", detail: "Approval is no longer pending", requestId }, 409, requestId);
  }
  return json({ data: { id: approvalId, status: decision === "APPROVE" ? "APPROVED" : "REJECTED" }, requestId }, 200, requestId);
}
