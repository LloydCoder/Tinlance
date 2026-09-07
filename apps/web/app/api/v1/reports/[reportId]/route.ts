import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const auth = await authenticateApi(request, "reports:read"); if ("response" in auth) return auth.response; const { reportId } = await context.params;
  const report = await db.workspaceReport.findFirst({ where: { id: reportId, organizationId: auth.principal.organizationId, status: { in: ["APPROVED", "PUBLISHED", "SUPERSEDED"] } }, select: { id: true, projectId: true, assessmentId: true, title: true, type: true, currentVersion: true, status: true, summary: true, generatedAt: true, publishedAt: true, contentHash: true, createdAt: true, updatedAt: true } });
  if (!report) return problem(auth.principal.requestId, 404, "resource_not_found", "Report not found"); return ok(request, report);
}
