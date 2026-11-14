import { NextResponse } from "next/server";
import { WorkspaceVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { getPrivateEvidence, readVerifiedPrivateEvidence } from "@/lib/workspace/storage";
import { canAccessWorkspaceOrganization, getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const FAILURE_CODES = new Set([
  "evidence_size_invalid",
  "evidence_manifest_invalid",
  "evidence_size_mismatch",
  "evidence_integrity_mismatch",
  "evidence_unavailable",
]);

export async function GET(request: Request, context: { params: Promise<{ evidenceId: string }> }) {
  const requestId = getRequestId(request);
  const { evidenceId } = await context.params;
  const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, "evidence:read")) {
    return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }

  const evidence = await db.workspaceEvidence.findUnique({
    where: { id: evidenceId },
    select: { id: true, organizationId: true, visibility: true, storageReference: true, mimeType: true, sizeBytes: true, contentHash: true },
  });
  if (!evidence
    || !canAccessWorkspaceOrganization(principal, evidence.organizationId)
    || evidence.visibility === WorkspaceVisibility.TINLANCE_INTERNAL
    || evidence.visibility === WorkspaceVisibility.RESTRICTED) {
    return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }

  const response = await getPrivateEvidence(evidence.storageReference);
  if (!response) {
    return NextResponse.json({ error: "evidence_unavailable", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }

  let verifiedBytes: ArrayBuffer;
  try {
    verifiedBytes = await readVerifiedPrivateEvidence(response, evidence.sizeBytes, evidence.contentHash);
  } catch (error) {
    const failure = error instanceof Error && FAILURE_CODES.has(error.message)
      ? error.message
      : "evidence_integrity_failure";
    await db.auditEvent.create({
      data: {
        organizationId: evidence.organizationId,
        actorUserId: principal.userId,
        action: "EVIDENCE_INTEGRITY_FAILURE",
        resourceType: "workspace_evidence",
        resourceId: evidence.id,
        requestId,
        metadata: { expectedContentHash: evidence.contentHash, failure },
      },
    });
    return NextResponse.json(
      { error: "evidence_integrity_failure", requestId },
      { status: 500, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  }

  await db.auditEvent.create({
    data: {
      organizationId: evidence.organizationId,
      actorUserId: principal.userId,
      action: "EVIDENCE_DOWNLOADED",
      resourceType: "workspace_evidence",
      resourceId: evidence.id,
      requestId,
      metadata: { contentHash: evidence.contentHash, verified: true, sizeBytes: verifiedBytes.byteLength },
    },
  });

  return new NextResponse(verifiedBytes, {
    status: 200,
    headers: {
      "content-type": evidence.mimeType,
      "content-length": verifiedBytes.byteLength.toString(),
      "content-disposition": `attachment; filename="evidence-${evidence.id}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      "x-request-id": requestId,
    },
  });
}
