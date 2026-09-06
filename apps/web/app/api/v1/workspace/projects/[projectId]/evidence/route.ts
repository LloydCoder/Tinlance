import { NextResponse } from "next/server";
import { WorkspaceVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { authorizeProject, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { putPrivateEvidence } from "@/lib/workspace/storage";
import { getRequestId } from "@/lib/security/request-id";

const MAX_FILES = 100;
const MAX_PROJECT_BYTES = 500n * 1024n * 1024n;

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request);
  const { projectId } = await context.params;
  const authorized = await authorizeProject(projectId, "evidence:read");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const evidence = await db.workspaceEvidence.findMany({
    where: { projectId, organizationId: authorized.project.organizationId, visibility: { not: WorkspaceVisibility.TINLANCE_INTERNAL } },
    orderBy: { createdAt: "desc" }, take: 100,
    select: { id: true, title: true, description: true, type: true, source: true, collectedAt: true, contentHash: true, hashAlgorithm: true, mimeType: true, sizeBytes: true, classification: true, integrityStatus: true, visibility: true, versionNumber: true, createdAt: true },
  });
  return NextResponse.json({ evidence, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request);
  const { projectId } = await context.params;
  const authorized = await authorizeProject(projectId, "evidence:upload");
  if (!authorized || !hasWorkspacePermission(authorized.principal, "evidence:upload")) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim() || null;
    const source = String(form.get("source") ?? "customer_upload").trim().slice(0, 120);
    const type = String(form.get("type") ?? "document").trim().slice(0, 80);
    const assessmentId = String(form.get("assessmentId") ?? "").trim() || null;
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() || null;
    if (!(file instanceof File) || !title || title.length > 200) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (assessmentId) {
      const assessment = await db.workspaceAssessment.findFirst({ where: { assessmentId, projectId, organizationId: authorized.project.organizationId }, select: { id: true } });
      if (!assessment) return NextResponse.json({ error: "assessment_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }
    if (idempotencyKey) {
      const existing = await db.workspaceEvidence.findUnique({ where: { idempotencyKey }, select: { id: true, projectId: true, organizationId: true } });
      if (existing && existing.projectId === projectId && existing.organizationId === authorized.project.organizationId) return NextResponse.json({ status: "duplicate", evidenceId: existing.id, requestId }, { status: 200, headers: { "cache-control": "no-store", "x-request-id": requestId } });
      if (existing) return NextResponse.json({ error: "idempotency_conflict", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    }
    const [count, usage] = await Promise.all([
      db.workspaceEvidence.count({ where: { projectId, organizationId: authorized.project.organizationId } }),
      db.workspaceEvidence.aggregate({ where: { projectId, organizationId: authorized.project.organizationId }, _sum: { sizeBytes: true } }),
    ]);
    if (count >= MAX_FILES || (usage._sum.sizeBytes ?? 0n) + BigInt(file.size) > MAX_PROJECT_BYTES) return NextResponse.json({ error: "project_storage_quota_exceeded", requestId }, { status: 413, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    const blob = await putPrivateEvidence({ organizationId: authorized.project.organizationId, projectId, file });
    const evidence = await db.$transaction(async (tx) => {
      const created = await tx.workspaceEvidence.create({ data: { organizationId: authorized.project.organizationId, projectId, assessmentId, title, description, type, source, collectedAt: new Date(), collectedByUserId: authorized.principal.userId, contentHash: blob.hash, hashAlgorithm: "SHA-256", mimeType: blob.mimeType, sizeBytes: BigInt(blob.size), storageReference: blob.url, classification: WorkspaceVisibility.CUSTOMER_CONFIDENTIAL, integrityStatus: "VERIFIED", visibility: WorkspaceVisibility.CUSTOMER_CONFIDENTIAL, idempotencyKey } });
      await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "EVIDENCE_UPLOADED", resourceType: "workspace_evidence", resourceId: created.id, requestId, metadata: { projectId, assessmentId, mimeType: blob.mimeType, sizeBytes: blob.size, hashAlgorithm: "SHA-256" } } });
      return created;
    });
    return NextResponse.json({ status: "created", evidenceId: evidence.id, contentHash: evidence.contentHash, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    console.error("workspace_evidence_upload_failed", { requestId, projectId, error });
    return NextResponse.json({ error: error instanceof Error && ["file_size_not_allowed","file_type_not_allowed","file_content_mismatch"].includes(error.message) ? error.message : "upload_failed", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
