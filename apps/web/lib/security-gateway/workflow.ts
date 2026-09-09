import { db } from "@/lib/db";
import { authorizeWorkspaceAction } from "@/lib/security-gateway";

const permissionForStep: Record<string, "assessment:execute" | "finding:update" | "report:read" | "remediation:update"> = {
  execute_fde: "assessment:execute",
  generate_findings: "finding:update",
  persist_result: "assessment:execute",
  request_evidence: "assessment:execute",
  draft_report: "report:read",
  publish_report: "report:read",
  create_remediation: "remediation:update",
  verification: "remediation:update",
  close: "remediation:update",
};

export async function authorizeWorkflowStep(input: { organizationId: string; actorUserId: string; action: string; resourceType: string; resourceId: string; requestId: string; stepKey: string }) {
  const [member, user] = await Promise.all([
    db.member.findUnique({ where: { organizationId_userId: { organizationId: input.organizationId, userId: input.actorUserId } }, select: { role: true } }),
    db.user.findUnique({ where: { id: input.actorUserId }, select: { role: true } }),
  ]);
  if (!member) return { decision: "DENY" as const, reasonCode: "ACTOR_NOT_ORGANIZATION_MEMBER" };
  const workspace = { userId: input.actorUserId, organizationId: input.organizationId, memberRole: member.role, globalRole: user?.role ?? null, isPrivileged: Boolean(user?.role && ["admin", "super-admin"].includes(user.role)) };
  const permission = permissionForStep[input.stepKey] ?? "assessment:execute";
  return authorizeWorkspaceAction({ workspace, permission, action: input.action, resourceType: input.resourceType, resourceId: input.resourceId, requestId: input.requestId, context: { tenantId: input.organizationId, workflowStep: input.stepKey } });
}
