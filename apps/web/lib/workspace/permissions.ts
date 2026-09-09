export type WorkspacePermission =
  | "project:read" | "project:update" | "project:transition"
  | "assessment:read" | "assessment:create" | "assessment:update" | "assessment:execute"
  | "evidence:read" | "evidence:upload" | "evidence:verify"
  | "finding:read" | "finding:create" | "finding:update" | "finding:publish" | "finding:verify"
  | "report:read" | "report:create" | "report:publish" | "report:download"
  | "remediation:read" | "remediation:create" | "remediation:update" | "remediation:verify" | "remediation:close"
  | "evaluation:read" | "evaluation:create" | "evaluation:execute" | "evaluation:manage"
  | "knowledge:read" | "knowledge:create" | "knowledge:update" | "knowledge:delete" | "knowledge:share" | "knowledge:admin" | "knowledge:export" | "knowledge:ingest" | "knowledge:publish"
  | "workspace:manage" | "team:read" | "comment:write";

export type WorkspacePrincipal = Readonly<{ userId: string; organizationId: string; memberRole: string; globalRole: string | null; isPrivileged: boolean }>;

const privilegedRoles = new Set(["super-admin", "admin"]);
const knowledgeRead = ["knowledge:read"] as const;
const knowledgeManage = ["knowledge:create","knowledge:update","knowledge:delete","knowledge:share","knowledge:ingest","knowledge:publish"] as const;
const rolePermissions: Record<string, Set<WorkspacePermission>> = {
  "client-admin": new Set(["project:read","assessment:read","evidence:read","evidence:upload","finding:read","report:read","report:download","remediation:read","remediation:create","remediation:update","evaluation:read","evaluation:create","evaluation:execute","comment:write","team:read",...knowledgeRead,...knowledgeManage]),
  member: new Set(["project:read","assessment:read","evidence:read","evidence:upload","finding:read","report:read","report:download","remediation:read","remediation:update","evaluation:read","evaluation:create","evaluation:execute","comment:write","team:read",...knowledgeRead]),
  viewer: new Set(["project:read","assessment:read","evidence:read","finding:read","report:read","report:download","remediation:read","evaluation:read","team:read",...knowledgeRead]),
  owner: new Set(["project:read","project:update","project:transition","assessment:read","assessment:create","assessment:update","assessment:execute","evidence:read","evidence:upload","evidence:verify","finding:read","finding:create","finding:update","finding:publish","finding:verify","report:read","report:create","report:publish","report:download","remediation:read","remediation:create","remediation:update","remediation:verify","remediation:close","evaluation:read","evaluation:create","evaluation:execute","evaluation:manage",...knowledgeRead,...knowledgeManage,"knowledge:admin","knowledge:export","workspace:manage","team:read","comment:write"]),
};
const privilegedPermissions = new Set<WorkspacePermission>(["project:read","project:update","project:transition","assessment:read","assessment:create","assessment:update","assessment:execute","evidence:read","evidence:upload","evidence:verify","finding:read","finding:create","finding:update","finding:publish","finding:verify","report:read","report:create","report:publish","report:download","remediation:read","remediation:create","remediation:update","remediation:verify","remediation:close","evaluation:read","evaluation:create","evaluation:execute","evaluation:manage",...knowledgeRead,...knowledgeManage,"knowledge:admin","knowledge:export","workspace:manage","team:read","comment:write"]);

export function hasWorkspacePermission(principal: { memberRole: string; isPrivileged: boolean }, permission: WorkspacePermission) {
  if (principal.isPrivileged) return privilegedPermissions.has(permission);
  return rolePermissions[principal.memberRole]?.has(permission) ?? false;
}

export function isPrivilegedRole(role: string | null | undefined) { return Boolean(role && privilegedRoles.has(role)); }
