import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const domains = new Set(["cybersecurity", "finance", "healthtech", "logistics", "legal", "revops", "procurement", "custom"]);

export async function POST(request: Request, context: { params: Promise<{ assessmentId: string }> }) {
  const requestId = getRequestId(request);
  const { assessmentId } = await context.params;
  const assessment = await db.workspaceAssessment.findUnique({ where: { id: assessmentId }, select: { id: true, projectId: true, organizationId: true, type: true, objective: true, scope: true, methodology: true, version: true, status: true } });
  if (!assessment) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const authorized = await authorizeProject(assessment.projectId, "assessment:execute");
  if (!authorized || authorized.project.organizationId !== assessment.organizationId) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (assessment.status === "COMPLETED" || assessment.status === "REPORT_ISSUED") return NextResponse.json({ error: "assessment_already_completed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const domain = assessment.type.toLowerCase();
  if (!domains.has(domain)) return NextResponse.json({ error: "unsupported_domain", requestId }, { status: 422, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const fdeApiUrl = process.env.FDE_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.FDE_SERVICE_TOKEN;
  if (!fdeApiUrl || !serviceToken) return NextResponse.json({ error: "fde_not_configured", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || randomUUID();
  const existing = await db.workspaceAssessmentResult.findUnique({ where: { assessmentId: assessment.id }, select: { requestId: true, status: true, result: true, resultHash: true } });
  if (existing) return NextResponse.json({ status: existing.status, requestId: existing.requestId, resultHash: existing.resultHash, result: existing.result }, { status: 200, headers: { "cache-control": "private, no-store", "x-request-id": requestId } });

  const payload = { objective: assessment.objective, scope: assessment.scope, methodology: assessment.methodology, methodology_version: assessment.version, assessment_id: assessment.id, project_id: assessment.projectId };
  let response: Response;
  try {
    response = await fetch(`${fdeApiUrl}/v1/${domain}/execute`, { method: "POST", headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json", "idempotency-key": idempotencyKey, "x-request-id": requestId }, body: JSON.stringify({ tenant_id: assessment.organizationId, payload }), cache: "no-store" });
  } catch (error) {
    console.error("workspace_fde_upstream_failed", { requestId, assessmentId, error });
    return NextResponse.json({ error: "fde_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
  if (!response.ok) return NextResponse.json({ error: "fde_execution_failed", requestId }, { status: response.status >= 500 ? 503 : 502, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "fde_malformed_result", requestId }, { status: 502, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const resultHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  try {
    await db.$transaction(async (tx) => {
      await tx.workspaceAssessmentResult.create({ data: { assessmentId: assessment.id, organizationId: assessment.organizationId, projectId: assessment.projectId, requestId, status: "COMPLETED", result: body, resultHash } });
      await tx.workspaceAssessment.update({ where: { id: assessment.id }, data: { status: "COMPLETED", resultStatus: "PASS", completedAt: new Date() } });
      await tx.auditEvent.create({ data: { organizationId: assessment.organizationId, actorUserId: authorized.principal.userId, action: "ASSESSMENT_COMPLETED", resourceType: "workspace_assessment", resourceId: assessment.id, requestId, metadata: { fdeRequestId: typeof body.request_id === "string" ? body.request_id : null, resultHash, domain } } });
    });
  } catch (error) {
    const duplicate = await db.workspaceAssessmentResult.findUnique({ where: { assessmentId: assessment.id }, select: { requestId: true, status: true, result: true, resultHash: true } });
    if (duplicate) return NextResponse.json({ status: duplicate.status, requestId: duplicate.requestId, resultHash: duplicate.resultHash, result: duplicate.result }, { status: 200, headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
    console.error("workspace_assessment_result_persist_failed", { requestId, assessmentId, error });
    return NextResponse.json({ error: "result_persist_failed", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
  return NextResponse.json({ status: "completed", requestId, resultHash, result: body }, { status: 200, headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}
