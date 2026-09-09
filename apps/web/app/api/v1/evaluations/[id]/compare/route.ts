import { getRequestId } from "@/lib/security/request-id";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { authorizeEvaluation, compareRunToBaseline } from "@/lib/evaluation/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request);
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const requestId = getRequestId(request);
  const decision = await authorizeEvaluation({ organizationId: auth.principal.organizationId, userId: auth.principal.userId, permission: "evaluation:read", action: "evaluation.compare", resourceType: "EvaluationRun", resourceId: id, requestId });
  if (decision.decision !== "ALLOW") return problem(requestId, 403, "evaluation_authorization_denied", "Evaluation comparison denied");
  const body = await request.json().catch(() => null) as { baselineId?: string } | null;
  if (!body?.baselineId) return problem(requestId, 400, "baseline_required", "baselineId is required");
  try {
    const comparison = await compareRunToBaseline({ organizationId: auth.principal.organizationId, runId: id, baselineId: body.baselineId });
    return ok(request, comparison);
  } catch (error) {
    return problem(requestId, 404, "baseline_comparison_failed", "Baseline comparison failed", error instanceof Error ? error.message : "Unknown comparison error");
  }
}
