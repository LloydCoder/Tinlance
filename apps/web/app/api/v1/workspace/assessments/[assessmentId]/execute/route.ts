import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const domains = new Set(["cybersecurity","finance","healthtech","logistics","legal","revops","procurement","custom"]);

export async function POST(request: Request, context: { params: Promise<{ assessmentId: string }> }) {
  const requestId = getRequestId(request);
  const { assessmentId } = await context.params;
  const assessment = await db.workspaceAssessment.findUnique({ where: { id: assessmentId }, select: { id: true, projectId: true, organizationId: true, type: true, objective: true, scope: true, methodology: true, version: true, status: true } });
  if (!assessment) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const authorized = await authorizeProject(assessment.projectId, "assessment:execute");
  if (!authorized || authorized.project.organizationId !== assessment.organizationId) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const domain = assessment.type.toLowerCase();
  if (!domains.has(domain)) return NextResponse.json({ error: "unsupported_domain", requestId }, { status: 422, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const fdeApiUrl = process.env.FDE_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.FDE_SERVICE_TOKEN;
  if (!fdeApiUrl || !serviceToken) return NextResponse.json({ error: "fde_not_configured", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const idempotencyKey = request.headers.get("idempotency-key")?.trim() || randomUUID();
  const existing = await db.$queryRaw<Array<{ id: string; request_id: string; status: string; result: unknown }>>`
    SELECT "id", "requestId" AS request_id, "status", "result" FROM "WorkspaceAssessmentResult" WHERE "assessmentId" = ${assessment.id} LIMIT 1
  `;
  if (existing[0]) return NextResponse.json({ status: existing[0].status, requestId: existing[0].request_id, result: existing[0].result }, { status: 200, headers: { "cache-control": "private, no-store", "x-request-id": requestId } });

  const payload = { objective: assessment.objective, scope: assessment.scope, methodology: assessment.methodology, methodology_version: assessment.version, assessment_id: assessment.id, project_id: assessment.projectId };
  let response: Response;
  try {
    response = await fetch(`${fdeApiUrl}/v1/${domain}/execute`, {
      method: "POST",
      headers: { authorization: `Bearer ${serviceToken}`, "content-type": "application/json", "idempotency-key": idempotencyKey, "x-request-id": requestId },
      body: JSON.stringify({ tenant_id: assessment.organizationId, payload }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("workspace_fde_upstream_failed", { requestId, assessmentId, error });
    return NextResponse.json({ error: "fde_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
  if (!response.ok) return NextResponse.json({ error: "fde_execution_failed", requestId }, { status: response.status >= 500 ? 503 : 502, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "fde_malformed_result", requestId }, { status: 502, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const resultHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const resultId = randomUUID();
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO "WorkspaceAssessmentResult" ("id","assessmentId","organizationId","projectId","requestId","status","result","resultHash")
      VALUES (${resultId},${assessment.id},${assessment.organizationId},${assessment.projectId},${requestId},${"COMPLETED"},${JSON.stringify(body)}::jsonb,${resultHash})
    `;
    await tx.workspaceAssessment.update({ where: { id: assessment.id }, data: { status: "COMPLETED", resultStatus: "PASS", completedAt: new Date() } });
    await tx.auditEvent.create({ data: { organizationId: assessment.organizationId, actorUserId: authorized.principal.userId, action: "ASSESSMENT_COMPLETED", resourceType: "workspace_assessment", resourceId: assessment.id, requestId, metadata: { fdeRequestId: body.request_id ?? null, resultHash, domain } } });
  });
  return NextResponse.json({ status: "completed", requestId, resultHash, result: body }, { status: 200, headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}
