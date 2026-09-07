import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ assessmentId: string }> }) {
  const auth = await authenticateApi(request, "assessments:read"); if ("response" in auth) return auth.response; const { assessmentId } = await context.params;
  const assessment = await db.workspaceAssessment.findFirst({ where: { id: assessmentId, organizationId: auth.principal.organizationId }, select: { id: true, projectId: true, assessmentId: true, type: true, objective: true, scope: true, methodology: true, status: true, resultStatus: true, version: true, startedAt: true, completedAt: true, createdAt: true, updatedAt: true } });
  if (!assessment) return problem(auth.principal.requestId, 404, "resource_not_found", "Assessment not found");
  return ok(request, assessment);
}
