import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";

export async function GET(request: Request, context: { params: Promise<{ evidenceId: string }> }) {
  const auth = await authenticateApi(request, "evidence:read"); if ("response" in auth) return auth.response; const { evidenceId } = await context.params;
  const item = await db.workspaceEvidence.findFirst({ where: { id: evidenceId, organizationId: auth.principal.organizationId, visibility: { in: ["CUSTOMER", "CUSTOMER_CONFIDENTIAL"] } }, select: { id: true, projectId: true, assessmentId: true, title: true, description: true, type: true, source: true, collectedAt: true, contentHash: true, hashAlgorithm: true, mimeType: true, sizeBytes: true, classification: true, integrityStatus: true, versionNumber: true, createdAt: true, updatedAt: true } });
  if (!item) return problem(auth.principal.requestId, 404, "resource_not_found", "Evidence not found"); return ok(request, { ...item, sizeBytes: item.sizeBytes.toString() });
}
