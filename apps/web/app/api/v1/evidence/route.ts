import { db } from "@/lib/db";
import { authenticateApi, cursorPage, parsePagination } from "@/lib/api/v1";

export async function GET(request: Request) {
  const auth = await authenticateApi(request, "evidence:read"); if ("response" in auth) return auth.response; const { limit, cursor, url } = parsePagination(request); const projectId = url.searchParams.get("projectId");
  const rows = await db.workspaceEvidence.findMany({ where: { organizationId: auth.principal.organizationId, visibility: { in: ["CUSTOMER", "CUSTOMER_CONFIDENTIAL"] }, ...(projectId ? { projectId } : {}), ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: limit + 1, select: { id: true, projectId: true, assessmentId: true, title: true, description: true, type: true, source: true, collectedAt: true, contentHash: true, hashAlgorithm: true, mimeType: true, sizeBytes: true, classification: true, integrityStatus: true, versionNumber: true, createdAt: true, updatedAt: true } });
  const hasMore = rows.length > limit; const data = rows.slice(0, limit).map((item) => ({ ...item, sizeBytes: item.sizeBytes.toString() })); return cursorPage(request, data, hasMore ? data[data.length - 1]?.id ?? null : null, hasMore);
}
