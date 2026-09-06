import { NextResponse } from "next/server";
import { VerificationResult } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";
import { transitionFinding } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ method: z.string().trim().min(3).max(200), result: z.nativeEnum(VerificationResult), notes: z.string().trim().max(10000).optional(), evidenceId: z.string().optional() });

export async function POST(request: Request, context: { params: Promise<{ remediationId: string }> }) {
  const requestId = getRequestId(request); const { remediationId } = await context.params; const principal = await requireWorkspacePermission("remediation:verify");
  if (!principal || !principal.isPrivileged) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const remediation = await db.workspaceRemediation.findUnique({ where: { id: remediationId }, select: { id: true, organizationId: true, projectId: true, findingId: true } });
  if (!remediation) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (parsed.data.evidenceId) {
    const evidence = await db.workspaceEvidence.findFirst({ where: { id: parsed.data.evidenceId, organizationId: remediation.organizationId, projectId: remediation.projectId }, select: { id: true } });
    if (!evidence) return NextResponse.json({ error: "evidence_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
  try {
    const verification = await db.$transaction(async (tx) => {
      const created = await tx.workspaceVerification.create({ data: { organizationId: remediation.organizationId, projectId: remediation.projectId, findingId: remediation.findingId, remediationId: remediation.id, verifierUserId: principal.userId, method: parsed.data.method, result: parsed.data.result, notes: parsed.data.notes, evidenceId: parsed.data.evidenceId || null } });
      await tx.workspaceRemediation.update({ where: { id: remediation.id }, data: { verificationStatus: parsed.data.result, status: parsed.data.result === "PASS" ? "VERIFIED" : "IN_PROGRESS", completedAt: parsed.data.result === "PASS" ? new Date() : null } });
      await tx.auditEvent.create({ data: { organizationId: remediation.organizationId, actorUserId: principal.userId, action: "REMEDIATION_VERIFIED", resourceType: "workspace_verification", resourceId: created.id, requestId, metadata: { remediationId, findingId: remediation.findingId, result: parsed.data.result, method: parsed.data.method, evidenceId: parsed.data.evidenceId ?? null } } });
      return created;
    });
    if (parsed.data.result === "PASS") {
      await transitionFinding({ findingId: remediation.findingId, organizationId: remediation.organizationId, actorUserId: principal.userId, to: "VERIFIED", requestId });
    }
    return NextResponse.json({ status: "verified", verificationId: verification.id, result: parsed.data.result, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) { console.error("workspace_verification_failed", { requestId, remediationId, error }); return NextResponse.json({ error: "verification_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
