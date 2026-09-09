import { db } from "@/lib/db";
import { buildPrincipal } from "@/lib/security-gateway";
import { enforcePersistedSecurity } from "@/lib/security-gateway/runtime";

export async function authorizeAgentManagement(input: { organizationId: string; userId: string; action: string; resourceId?: string; requestId: string }) {
  const membership = await db.member.findUnique({ where: { organizationId_userId: { organizationId: input.organizationId, userId: input.userId } }, select: { role: true } });
  const user = await db.user.findUnique({ where: { id: input.userId }, select: { role: true } });
  if (!membership) throw new Error("agent_membership_required");
  const privileged = Boolean(user?.role && ["admin", "super-admin"].includes(user.role));
  if (!privileged && !["owner", "admin"].includes(membership.role)) return { decision: "DENY" as const, reasonCode: "INSUFFICIENT_AGENT_MANAGEMENT_ROLE" };
  const principal = buildPrincipal({ principalId: input.userId, principalType: "HUMAN", organizationId: input.organizationId, userId: input.userId, permissions: ["workspace:manage"], authenticationMethod: "better-auth-session", authenticationStrength: "MFA" });
  return enforcePersistedSecurity({ principal, action: input.action, resourceType: "McpAgent", resourceId: input.resourceId, requestedRisk: input.action.includes("revoke") ? "HIGH" : "MEDIUM", context: { tenantId: input.organizationId, requiredPermission: "workspace:manage" }, requestId: input.requestId });
}
