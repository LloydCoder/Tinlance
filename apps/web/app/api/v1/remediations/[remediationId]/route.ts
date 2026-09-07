import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ remediationId: string }> }) {
  const auth = await authenticateApi(request, "remediation:read"); if ("response" in auth) return auth.response; const { remediationId } = await context.params;
  const remediation = await db.workspaceRemediation.findFirst({ where: { id: remediationId, organizationId: auth.principal.organizationId }, select: { id: true, projectId: true, findingId: true, title: true, description: true, priority: true, status: true, targetDate: true, completedAt: true, verificationStatus: true, createdAt: true, updatedAt: true } });
  if (!remediation) return problem(auth.principal.requestId, 404, "resource_not_found", "Remediation not found"); return ok(request, remediation);
}
