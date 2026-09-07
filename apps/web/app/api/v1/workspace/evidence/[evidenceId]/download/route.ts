import { NextResponse } from "next/server";
import { WorkspaceVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { getPrivateEvidence } from "@/lib/workspace/storage";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ evidenceId: string }> }) {
  const requestId = getRequestId(request);
  const { evidenceId } = await context.params;
  const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, "evidence:read")) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const evidence = await db.workspaceEvidence.findUnique({ where: { id: evidenceId }, select: { id: true, organizationId: true, visibility: true, storageReference: true, mimeType: true, sizeBytes: true, contentHash: true } });
  if (!evidence || (!principal.isPrivileged && evidence.organizationId !== principal.organizationId) || evidence.visibility === WorkspaceVisibility.TINLANCE_INTERNAL || evidence.visibility === WorkspaceVisibility.RESTRICTED) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const response = await getPrivateEvidence(evidence.storageReference);
  if (!response) return NextResponse.json({ error: "evidence_unavailable", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  await db.auditEvent.create({ data: { organizationId: evidence.organizationId, actorUserId: principal.userId, action: "EVIDENCE_DOWNLOADED", resourceType: "workspace_evidence", resourceId: evidence.id, requestId, metadata: { contentHash: evidence.contentHash } } });
  return new NextResponse(response.body, { status: 200, headers: { "content-type": evidence.mimeType, "content-length": evidence.sizeBytes.toString(), "content-disposition": `attachment; filename="evidence-${evidence.id}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff", "x-request-id": requestId } });
}
