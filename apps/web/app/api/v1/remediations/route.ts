import { db } from "@/lib/db";
import { authenticateApi, cursorPage, parsePagination } from "@/lib/api/v1";

export async function GET(request: Request) {
  const auth = await authenticateApi(request, "remediation:read"); if ("response" in auth) return auth.response; const { limit, cursor, url } = parsePagination(request); const projectId = url.searchParams.get("projectId");
  const rows = await db.workspaceRemediation.findMany({ where: { organizationId: auth.principal.organizationId, ...(projectId ? { projectId } : {}), ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: limit + 1, select: { id: true, projectId: true, findingId: true, title: true, description: true, priority: true, status: true, targetDate: true, completedAt: true, verificationStatus: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > limit; const data = rows.slice(0, limit); return cursorPage(request, data, hasMore ? data[data.length - 1]?.id ?? null : null, hasMore);
}
