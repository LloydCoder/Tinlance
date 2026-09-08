import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ findingId: string }> }) {
  const auth = await authenticateApi(request, "findings:read"); if ("response" in auth) return auth.response; const { findingId } = await context.params;
  const finding = await db.workspaceFinding.findFirst({ where: { id: findingId, organizationId: auth.principal.organizationId, visibility: { in: ["CUSTOMER", "CUSTOMER_CONFIDENTIAL"] } }, select: { id: true, projectId: true, assessmentId: true, title: true, description: true, category: true, severity: true, likelihood: true, impact: true, status: true, affectedAsset: true, recommendation: true, dueDate: true, createdAt: true, updatedAt: true } });
  if (!finding) return problem(auth.principal.requestId, 404, "resource_not_found", "Finding not found"); return ok(request, finding);
}
