import { db } from "@/lib/db";
import { startAutomation } from "@/lib/automation/engine";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

const domains = new Set(["cybersecurity", "finance", "healthtech", "logistics", "legal", "revops", "procurement", "custom"]);

export async function POST(request: Request, context: { params: Promise<{ assessmentId: string }> }) {
  const auth = await authenticateApi(request, "assessments:execute"); if ("response" in auth) return auth.response; const { assessmentId } = await context.params;
  const assessment = await db.workspaceAssessment.findFirst({ where: { id: assessmentId, organizationId: auth.principal.organizationId }, select: { id: true, projectId: true, organizationId: true, type: true, status: true, assessmentId: true } });
  if (!assessment) return problem(auth.principal.requestId, 404, "resource_not_found", "Assessment not found");
  if (assessment.status === "COMPLETED" || assessment.status === "REPORT_ISSUED") return problem(auth.principal.requestId, 409, "conflict", "Assessment already completed");
  const domain = assessment.type.toLowerCase(); if (!domains.has(domain)) return problem(auth.principal.requestId, 422, "validation_failed", "Unsupported assessment domain");
  const idempotencyKey = request.headers.get("idempotency-key")?.trim(); if (!idempotencyKey || idempotencyKey.length > 255) return problem(auth.principal.requestId, 400, "idempotency_required", "Idempotency-Key is required for execution");
  try {
    const run = await startAutomation({ organizationId: auth.principal.organizationId, projectId: assessment.projectId, assessmentId: assessment.assessmentId, playbookSlug: "fde-technical-assessment", actorUserId: auth.principal.userId, triggerType: "API", idempotencyKey: `api-assessment:${assessmentId}:${idempotencyKey}`, requestId: auth.principal.requestId, input: { assessmentId, domain, source: "api-v1" } });
    await db.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "ASSESSMENT_EXECUTION_REQUESTED", resourceType: "workspace_assessment", resourceId: assessmentId, requestId: auth.principal.requestId, metadata: { workflowRunId: run.id, domain, apiVersion: "v1" } } });
    return ok(request, { workflowRunId: run.id, status: run.status, assessmentId }, 202, { "retry-after": "5" });
  } catch (error) {
    console.error("api_assessment_execution_failed", { requestId: auth.principal.requestId, assessmentId, error });
    if (error instanceof Error && /idempotency|conflict|duplicate/i.test(error.message)) return problem(auth.principal.requestId, 409, "idempotency_conflict", "Execution request conflicts with an existing workflow");
    return problem(auth.principal.requestId, 503, "upstream_unavailable", "Assessment execution is temporarily unavailable");
  }
}
