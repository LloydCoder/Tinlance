import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorizeAgentPermission } from "@/lib/security-gateway/agent";
import { type AuthInfo } from "@modelcontextprotocol/server";
import { type McpToolDefinition } from "@/lib/mcp/registry";

export type McpDecision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
export type McpPrincipal = { organizationId: string; agentId: string; clientId: string; ownerUserId: string; environment: string; scopes: readonly string[]; issuer?: string };
function extra(authInfo: AuthInfo, key: string): string | null { const value = authInfo.extra?.[key]; return typeof value === "string" ? value : null; }
export function principalFromAuth(authInfo: AuthInfo): McpPrincipal | null { const organizationId = extra(authInfo, "organizationId"); const agentId = extra(authInfo, "agentId"); const ownerUserId = extra(authInfo, "ownerUserId"); const environment = extra(authInfo, "environment") ?? "production"; if (!organizationId || !agentId || !ownerUserId || !authInfo.clientId) return null; return { organizationId, agentId, clientId: authInfo.clientId, ownerUserId, environment, scopes: authInfo.scopes, issuer: extra(authInfo, "issuer") ?? undefined }; }
export function parameterHash(args: Record<string, unknown>) { const copy = { ...args }; delete copy.approvalId; return createHash("sha256").update(JSON.stringify(copy)).digest("hex"); }

export async function authorizeMcpTool(input: { principal: McpPrincipal; tool: McpToolDefinition; args: Record<string, unknown>; requestId: string }) {
  const { principal, tool, args, requestId } = input;
  const agentRows = await db.$queryRaw<Array<{ status: string; allowedTools: unknown; scopes: unknown; environment: string; organizationId: string; ownerUserId: string; clientId: string }>>(Prisma.sql`SELECT "status","allowedTools","scopes","environment","organizationId","ownerUserId","clientId" FROM "McpAgent" WHERE "id"=${principal.agentId} AND "organizationId"=${principal.organizationId} LIMIT 1`);
  const agent = agentRows[0];
  const allowedTools = Array.isArray(agent?.allowedTools) ? agent.allowedTools.filter((value): value is string => typeof value === "string") : [];
  const grantedScopes = Array.isArray(agent?.scopes) ? agent.scopes.filter((value): value is string => typeof value === "string") : [];
  const scopeAllowed = tool.requiredScopes.every((scope) => principal.scopes.includes(scope) && grantedScopes.includes(scope));
  const toolAllowed = allowedTools.includes(tool.toolId);
  const environmentAllowed = tool.allowedEnvironments.includes(principal.environment);
  let decision: McpDecision = "ALLOW"; let reason = "authorized"; let workspace = null;
  if (!agent || agent.status !== "ACTIVE" || agent.organizationId !== principal.organizationId || agent.ownerUserId !== principal.ownerUserId || agent.clientId !== principal.clientId) { decision = "DENY"; reason = "agent_identity_invalid"; }
  else if (!toolAllowed) { decision = "DENY"; reason = "tool_not_granted"; }
  else if (!scopeAllowed) { decision = "DENY"; reason = "scope_denied"; }
  else if (!environmentAllowed) { decision = "DENY"; reason = "environment_denied"; }
  else {
    const risk = tool.riskLevel === "DESTRUCTIVE" ? "CRITICAL" : tool.riskLevel === "HIGH_IMPACT" ? "HIGH" : tool.riskLevel === "MUTATE" || tool.riskLevel === "ANALYZE" ? "MEDIUM" : "LOW";
    const security = await authorizeAgentPermission({ organizationId: principal.organizationId, agentId: principal.agentId, clientId: principal.clientId, ownerUserId: principal.ownerUserId, scopes: principal.scopes, environment: principal.environment, permission: tool.requiredPermissions[0] as never, action: tool.name, resourceType: "McpTool", toolId: tool.toolId, requestId, risk, approvalPresent: typeof args.approvalId === "string" });
    if (security.decision === "DENY" || security.decision === "BLOCKED") { decision = "DENY"; reason = security.reasonCode.toLowerCase(); }
    else if (tool.requiredPermissions.length > 1) { decision = "DENY"; reason = "multiple_permissions_require_explicit_policy"; }
    else if (tool.approvalRequired) { decision = "REQUIRE_APPROVAL"; reason = "human_approval_required"; }
  }
  await auditMcpDecision({ principal, tool, requestId, decision, reason, args });
  return { decision, reason, workspace };
}

export async function createApproval(input: { principal: McpPrincipal; tool: McpToolDefinition; args: Record<string, unknown>; requestId: string }) {
  const id = `mcp_appr_${randomUUID().replaceAll("-", "")}`;
  const targetResourceId = typeof input.args.projectId === "string" ? input.args.projectId : typeof input.args.assessmentId === "string" ? input.args.assessmentId : null;
  const hash = parameterHash(input.args);
  await db.$executeRaw(Prisma.sql`INSERT INTO "McpApproval" ("id","organizationId","agentId","requestedByUserId","toolId","toolVersion","resourceType","resourceId","parameterHash","status","expiresAt","createdAt","updatedAt") VALUES (${id},${input.principal.organizationId},${input.principal.agentId},${input.principal.ownerUserId},${input.tool.toolId},${input.tool.version},${targetResourceId ? "workspace_resource" : null},${targetResourceId},${hash},'PENDING',CURRENT_TIMESTAMP + INTERVAL '15 minutes',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
  await db.auditEvent.create({ data: { organizationId: input.principal.organizationId, actorUserId: input.principal.ownerUserId, action: "MCP_APPROVAL_REQUESTED", resourceType: "McpApproval", resourceId: id, requestId: input.requestId, metadata: { agentId: input.principal.agentId, clientId: input.principal.clientId, toolId: input.tool.toolId, toolVersion: input.tool.version, riskLevel: input.tool.riskLevel, parameterHash: hash, targetResourceId } } });
  return id;
}

export async function consumeApproval(input: { principal: McpPrincipal; tool: McpToolDefinition; args: Record<string, unknown>; approvalId: string; requestId: string }) {
  const hash = parameterHash(input.args);
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; approvedByUserId: string | null; status: string; expiresAt: Date; consumedAt: Date | null; parameterHash: string; agentId: string; organizationId: string; toolId: string; toolVersion: string; resourceId: string | null }>>(Prisma.sql`SELECT "id","approvedByUserId","status","expiresAt","consumedAt","parameterHash","agentId","organizationId","toolId","toolVersion","resourceId" FROM "McpApproval" WHERE "id"=${input.approvalId} AND "organizationId"=${input.principal.organizationId} AND "agentId"=${input.principal.agentId} FOR UPDATE`);
    const approval = rows[0];
    if (!approval || approval.status !== "APPROVED" || approval.expiresAt <= new Date() || approval.consumedAt) throw new Error("approval_invalid");
    if (approval.approvedByUserId === input.principal.ownerUserId) throw new Error("approval_self_approval_forbidden");
    const targetResourceId = typeof input.args.projectId === "string" ? input.args.projectId : typeof input.args.assessmentId === "string" ? input.args.assessmentId : null;
    if (approval.parameterHash !== hash || approval.toolId !== input.tool.toolId || approval.toolVersion !== input.tool.version || approval.agentId !== input.principal.agentId || approval.resourceId !== targetResourceId) throw new Error("approval_binding_mismatch");
    const updated = await tx.$executeRaw(Prisma.sql`UPDATE "McpApproval" SET "status"='CONSUMED',"consumedAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${approval.id} AND "status"='APPROVED' AND "consumedAt" IS NULL`);
    if (updated !== 1) throw new Error("approval_replay");
    await tx.auditEvent.create({ data: { organizationId: input.principal.organizationId, actorUserId: input.principal.ownerUserId, action: "MCP_APPROVAL_CONSUMED", resourceType: "McpApproval", resourceId: approval.id, requestId: input.requestId, metadata: { agentId: input.principal.agentId, toolId: input.tool.toolId, toolVersion: input.tool.version, approvedByUserId: approval.approvedByUserId, parameterHash: hash } } });
    return approval;
  });
}

export async function auditMcpDecision(input: { principal: McpPrincipal; tool: McpToolDefinition; requestId: string; decision: McpDecision; reason: string; args: Record<string, unknown>; outcome?: string; durationMs?: number; errorCode?: string }) {
  const metadata = { agentId: input.principal.agentId, clientId: input.principal.clientId, toolId: input.tool.toolId, toolVersion: input.tool.version, action: input.tool.name, authorizationDecision: input.decision, policyDecision: input.reason, riskLevel: input.tool.riskLevel, inputClassification: input.tool.dataClassification, outputClassification: input.tool.dataClassification, durationMs: input.durationMs ?? null, outcome: input.outcome ?? null, errorCode: input.errorCode ?? null, parameterHash: parameterHash(input.args) };
  await db.auditEvent.create({ data: { organizationId: input.principal.organizationId, actorUserId: input.principal.ownerUserId, action: `MCP_${input.decision}`, resourceType: "McpTool", resourceId: input.tool.toolId, requestId: input.requestId, metadata } });
}
