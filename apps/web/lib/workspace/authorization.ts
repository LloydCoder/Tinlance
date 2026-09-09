import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { enforcePersistedSecurity } from "@/lib/security-gateway/runtime";
import { hasWorkspacePermission, isPrivilegedRole, type WorkspacePermission } from "@/lib/workspace/permissions";

export type { WorkspacePermission } from "@/lib/workspace/permissions";
export type WorkspacePrincipal = Readonly<{ userId: string; organizationId: string; memberRole: string; globalRole: string | null; isPrivileged: boolean }>;

async function m7Authorize(principal: WorkspacePrincipal, permission: WorkspacePermission, resourceType: string, resourceId?: string) {
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? randomUUID();
  return enforcePersistedSecurity({
    principal: { principalId: principal.userId, principalType: "HUMAN", organizationId: principal.organizationId, userId: principal.userId, scopes: [], permissions: hasWorkspacePermission(principal, permission) ? [permission] : [], authenticationMethod: "better-auth-session", authenticationStrength: "MFA" },
    action: "workspace.authorization",
    resourceType,
    resourceId,
    requestedRisk: "LOW",
    context: { tenantId: principal.organizationId, requiredPermission: permission },
    stepUpToken: requestHeaders.get("x-security-step-up") ?? undefined,
    requestId,
  });
}

export async function getWorkspacePrincipal(): Promise<WorkspacePrincipal | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const organizationId = session.session.activeOrganizationId;
  if (!organizationId) return null;
  const [membership, user] = await Promise.all([
    db.member.findUnique({ where: { organizationId_userId: { organizationId, userId: session.user.id } }, select: { role: true } }),
    db.user.findUnique({ where: { id: session.user.id }, select: { role: true } }),
  ]);
  if (!membership) return null;
  return { userId: session.user.id, organizationId, memberRole: membership.role, globalRole: user?.role ?? null, isPrivileged: isPrivilegedRole(user?.role) };
}

export async function authorizeProject(projectId: string, permission: WorkspacePermission) {
  const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, permission)) return null;
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true, name: true, status: true, type: true, engagementId: true, description: true } });
  if (!project || (!principal.isPrivileged && project.organizationId !== principal.organizationId)) return null;
  const decision = await m7Authorize(principal, permission, "Project", project.id);
  if (decision.decision !== "ALLOW") return null;
  return { principal, project };
}

export async function requireWorkspacePermission(permission: WorkspacePermission) {
  const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, permission)) return null;
  const decision = await m7Authorize(principal, permission, "Workspace", principal.organizationId);
  if (decision.decision !== "ALLOW") return null;
  return principal;
}
