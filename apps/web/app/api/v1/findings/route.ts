import { db } from "@/lib/db";
import { authenticateApi, cursorPage, parsePagination, problem } from "@/lib/api/v1";

export async function GET(request: Request) {
  const auth = await authenticateApi(request, "findings:read"); if ("response" in auth) return auth.response; const { limit, cursor, url } = parsePagination(request); const projectId = url.searchParams.get("projectId");
  const rows = await db.workspaceFinding.findMany({ where: { organizationId: auth.principal.organizationId, visibility: { in: ["CUSTOMER", "CUSTOMER_CONFIDENTIAL"] }, ...(projectId ? { projectId } : {}), ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: limit + 1, select: { id: true, projectId: true, assessmentId: true, title: true, description: true, category: true, severity: true, likelihood: true, impact: true, status: true, affectedAsset: true, recommendation: true, dueDate: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > limit; const data = rows.slice(0, limit); return cursorPage(request, data, hasMore ? data[data.length - 1]?.id ?? null : null, hasMore);
}
