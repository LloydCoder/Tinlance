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

export function hasWorkspacePermission(principal: { memberRole: string; isPrivileged: boolean }, permission: WorkspacePermission) {
  if (principal.isPrivileged) return privilegedPermissions.has(permission);
  return rolePermissions[principal.memberRole]?.has(permission) ?? false;
}

export function isPrivilegedRole(role: string | null | undefined) { return Boolean(role && privilegedRoles.has(role)); }
