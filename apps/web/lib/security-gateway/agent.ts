import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { hasWorkspacePermission, type WorkspacePermission, type WorkspacePrincipal } from "@/lib/workspace/authorization";
import { buildPrincipal } from "@/lib/security-gateway";
import { enforcePersistedSecurity } from "@/lib/security-gateway/runtime";

export async function authorizeAgentPermission(input: { organizationId: string; agentId: string; clientId: string; ownerUserId: string; scopes: readonly string[]; environment: string; permission: WorkspacePermission; action: string; resourceType: string; resourceId?: string; toolId?: string; requestId: string; risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; approvalPresent?: boolean }) {
  const [member, user] = await Promise.all([
    db.member.findUnique({ where: { organizationId_userId: { organizationId: input.organizationId, userId: input.ownerUserId } }, select: { role: true } }),
    db.user.findUnique({ where: { id: input.ownerUserId }, select: { role: true } }),
  ]);
  const workspace: WorkspacePrincipal | null = member ? { userId: input.ownerUserId, organizationId: input.organizationId, memberRole: member.role, globalRole: user?.role ?? null, isPrivileged: Boolean(user?.role && ["admin", "super-admin"].includes(user.role)) } : null;
  const granted = Boolean(workspace && hasWorkspacePermission(workspace, input.permission));
  const principal = buildPrincipal({ principalId: input.agentId, principalType: "AI_AGENT", organizationId: input.organizationId, userId: input.ownerUserId, agentId: input.agentId, clientId: input.clientId, scopes: input.scopes, permissions: granted ? [input.permission] : [], delegationId: input.ownerUserId, authenticationMethod: "mcp-bearer", authenticationStrength: "STRONG", environment: input.environment });
  return enforcePersistedSecurity({ principal, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, toolId: input.toolId, requestedRisk: input.risk, approvalPresent: input.approvalPresent, context: { tenantId: input.organizationId, requiredPermission: input.permission }, requestId: input.requestId });
}
