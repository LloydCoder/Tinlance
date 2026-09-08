import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const principal = await getWorkspacePrincipal();
  const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return new Response(JSON.stringify({ code: "FORBIDDEN", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const { approvalId } = await context.params;
  const rows = await db.$queryRaw<Array<{ id: string; agentId: string; requestedByUserId: string; approvedByUserId: string | null; toolId: string; toolVersion: string; resourceType: string | null; resourceId: string | null; parameterHash: string; status: string; expiresAt: Date; approvedAt: Date | null; consumedAt: Date | null; createdAt: Date }>>(Prisma.sql`SELECT "id","agentId","requestedByUserId","approvedByUserId","toolId","toolVersion","resourceType","resourceId","parameterHash","status","expiresAt","approvedAt","consumedAt","createdAt" FROM "McpApproval" WHERE "id"=${approvalId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  const row = rows[0];
  if (!row) return new Response(JSON.stringify({ code: "NOT_FOUND", requestId }), { status: 404, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  return new Response(JSON.stringify({ data: { ...row, expiresAt: row.expiresAt.toISOString(), approvedAt: row.approvedAt?.toISOString() ?? null, consumedAt: row.consumedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), parameterHash: undefined }, requestId }), { status: 200, headers: { "content-type": "application/json", "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ approvalId: string }> }) {
  const principal = await getWorkspacePrincipal();
  const requestId = getRequestId(request);
  if (!principal || !hasWorkspacePermission(principal, "workspace:manage")) return new Response(JSON.stringify({ code: "FORBIDDEN", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const body = (await request.json().catch(() => null)) as { decision?: string } | null;
  const decision = body?.decision === "APPROVE" || body?.decision === "REJECT" ? body.decision : null;
  if (!decision) return new Response(JSON.stringify({ code: "INVALID_ARGUMENT", requestId }), { status: 422, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  const { approvalId } = await context.params;
  const rows = await db.$queryRaw<Array<{ id: string; requestedByUserId: string; status: string; expiresAt: Date; agentId: string; toolId: string; toolVersion: string }>>(Prisma.sql`SELECT "id","requestedByUserId","status","expiresAt","agentId","toolId","toolVersion" FROM "McpApproval" WHERE "id"=${approvalId} AND "organizationId"=${principal.organizationId} FOR UPDATE`);
  const row = rows[0];
  if (!row || row.status !== "PENDING" || row.expiresAt <= new Date()) return new Response(JSON.stringify({ code: "CONFLICT", detail: "Approval is no longer pending", requestId }), { status: 409, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  if (row.requestedByUserId === principal.userId) return new Response(JSON.stringify({ code: "FORBIDDEN", detail: "The requester cannot approve its own agent action", requestId }), { status: 403, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
  await db.$executeRaw(Prisma.sql`UPDATE "McpApproval" SET "status"=${decision === "APPROVE" ? "APPROVED" : "REJECTED"},"approvedByUserId"=${principal.userId},"approvedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${approvalId} AND "status"='PENDING'`);
  await db.auditEvent.create({ data: { organizationId: principal.organizationId, actorUserId: principal.userId, action: decision === "APPROVE" ? "MCP_APPROVAL_APPROVED" : "MCP_APPROVAL_REJECTED", resourceType: "McpApproval", resourceId: approvalId, requestId, metadata: { agentId: row.agentId, toolId: row.toolId, toolVersion: row.toolVersion, requestedByUserId: row.requestedByUserId } } });
  return new Response(JSON.stringify({ data: { id: approvalId, status: decision === "APPROVE" ? "APPROVED" : "REJECTED" }, requestId }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store", "x-request-id": requestId } });
}
