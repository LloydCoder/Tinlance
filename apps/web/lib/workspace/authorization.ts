import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type WorkspacePermission =
  | "project:read" | "project:update" | "project:transition"
  | "assessment:read" | "assessment:create" | "assessment:update" | "assessment:execute"
  | "evidence:read" | "evidence:upload" | "evidence:verify"
  | "finding:read" | "finding:create" | "finding:update" | "finding:publish" | "finding:verify"
  | "report:read" | "report:create" | "report:publish" | "report:download"
  | "remediation:read" | "remediation:create" | "remediation:update" | "remediation:verify" | "remediation:close"
  | "workspace:manage" | "team:read" | "comment:write";

const privilegedRoles = new Set(["super-admin", "admin"]);
const rolePermissions: Record<string, Set<WorkspacePermission>> = {
  "client-admin": new Set(["project:read","assessment:read","evidence:read","evidence:upload","finding:read","report:read","report:download","remediation:read","remediation:create","remediation:update","comment:write","team:read"]),
  member: new Set(["project:read","assessment:read","evidence:read","evidence:upload","finding:read","report:read","report:download","remediation:read","remediation:update","comment:write","team:read"]),
  viewer: new Set(["project:read","assessment:read","evidence:read","finding:read","report:read","report:download","remediation:read","team:read"]),
  owner: new Set(["project:read","project:update","project:transition","assessment:read","assessment:create","assessment:update","assessment:execute","evidence:read","evidence:upload","evidence:verify","finding:read","finding:create","finding:update","finding:publish","finding:verify","report:read","report:create","report:publish","report:download","remediation:read","remediation:create","remediation:update","remediation:verify","remediation:close","workspace:manage","team:read","comment:write"]),
};
const privilegedPermissions = new Set<WorkspacePermission>(["project:read","project:update","project:transition","assessment:read","assessment:create","assessment:update","assessment:execute","evidence:read","evidence:upload","evidence:verify","finding:read","finding:create","finding:update","finding:publish","finding:verify","report:read","report:create","report:publish","report:download","remediation:read","remediation:create","remediation:update","remediation:verify","remediation:close","workspace:manage","team:read","comment:write"]);

export type WorkspacePrincipal = Readonly<{ userId: string; organizationId: string; memberRole: string; globalRole: string | null; isPrivileged: boolean }>;
export async function getWorkspacePrincipal(): Promise<WorkspacePrincipal | null> {
  const session = await auth.api.getSession({ headers: await headers() }); if (!session) return null; const organizationId = session.session.activeOrganizationId; if (!organizationId) return null;
  const [membership, user] = await Promise.all([db.member.findUnique({ where: { organizationId_userId: { organizationId, userId: session.user.id } }, select: { role: true } }), db.user.findUnique({ where: { id: session.user.id }, select: { role: true } })]); if (!membership) return null;
  return { userId: session.user.id, organizationId, memberRole: membership.role, globalRole: user?.role ?? null, isPrivileged: Boolean(user?.role && privilegedRoles.has(user.role)) };
}
export function hasWorkspacePermission(principal: WorkspacePrincipal, permission: WorkspacePermission) { if (principal.isPrivileged) return privilegedPermissions.has(permission); return rolePermissions[principal.memberRole]?.has(permission) ?? false; }
export async function authorizeProject(projectId: string, permission: WorkspacePermission) {
  const principal = await getWorkspacePrincipal(); if (!principal || !hasWorkspacePermission(principal, permission)) return null;
  const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, organizationId: true, name: true, status: true, type: true, engagementId: true, description: true } });
  if (!project || (!principal.isPrivileged && project.organizationId !== principal.organizationId)) return null; return { principal, project };
}
export async function requireWorkspacePermission(permission: WorkspacePermission) { const principal = await getWorkspacePrincipal(); if (!principal || !hasWorkspacePermission(principal, permission)) return null; return principal; }
