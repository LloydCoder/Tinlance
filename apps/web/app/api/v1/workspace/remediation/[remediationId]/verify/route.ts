import { NextResponse } from "next/server";
import { VerificationResult } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { canAccessWorkspaceOrganization, requireWorkspacePermission } from "@/lib/workspace/authorization";
import { assertIndependentVerification } from "@/lib/workspace/workflow";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ method: z.string().trim().min(3).max(200), result: z.nativeEnum(VerificationResult), notes: z.string().trim().max(10000).optional(), evidenceId: z.string().optional() });

export async function POST(request: Request, context: { params: Promise<{ remediationId: string }> }) {
  const requestId = getRequestId(request);
  const { remediationId } = await context.params;
  const principal = await requireWorkspacePermission("remediation:verify");
  if (!principal || !principal.isPrivileged) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  const remediation = await db.workspaceRemediation.findUnique({
    where: { id: remediationId },
    select: { id: true, organizationId: true, projectId: true, findingId: true },
  });
  if (!remediation || !canAccessWorkspaceOrganization(principal, remediation.organizationId)) {
    return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  if (parsed.data.evidenceId) {
    const evidence = await db.workspaceEvidence.findFirst({
      where: { id: parsed.data.evidenceId, organizationId: remediation.organizationId, projectId: remediation.projectId },
      select: { id: true },
    });
    if (!evidence) return NextResponse.json({ error: "evidence_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }

  try {
    const verification = await db.$transaction(async (tx) => {
      const currentRemediation = await tx.workspaceRemediation.findFirst({
        where: { id: remediation.id, organizationId: remediation.organizationId },
        select: { id: true, status: true, ownerUserId: true, findingId: true },
      });
      if (!currentRemediation) throw new Error("remediation_not_found");

      const finding = await tx.workspaceFinding.findFirst({
        where: { id: currentRemediation.findingId, organizationId: remediation.organizationId },
        select: { id: true, status: true },
      });
      if (!finding) throw new Error("finding_not_found");

      assertIndependentVerification({
        remediationStatus: currentRemediation.status,
        findingStatus: finding.status,
        ownerUserId: currentRemediation.ownerUserId,
        verifierUserId: principal.userId,
      });

      const created = await tx.workspaceVerification.create({
        data: {
          organizationId: remediation.organizationId,
          projectId: remediation.projectId,
          findingId: currentRemediation.findingId,
          remediationId: currentRemediation.id,
          verifierUserId: principal.userId,
          method: parsed.data.method,
          result: parsed.data.result,
          notes: parsed.data.notes,
          evidenceId: parsed.data.evidenceId || null,
        },
      });

      const remediationUpdate = await tx.workspaceRemediation.updateMany({
        where: { id: currentRemediation.id, organizationId: remediation.organizationId, status: "READY_FOR_VERIFICATION" },
        data: {
          verificationStatus: parsed.data.result,
          status: parsed.data.result === "PASS" ? "VERIFIED" : "IN_PROGRESS",
          completedAt: parsed.data.result === "PASS" ? new Date() : null,
        },
      });
      if (remediationUpdate.count !== 1) throw new Error("remediation_verification_race");

      const findingUpdate = await tx.workspaceFinding.updateMany({
        where: { id: finding.id, organizationId: remediation.organizationId, status: "VERIFICATION_PENDING" },
        data: { status: parsed.data.result === "PASS" ? "VERIFIED" : "IN_PROGRESS", visibility: "CUSTOMER" },
      });
      if (findingUpdate.count !== 1) throw new Error("finding_verification_race");

      await tx.auditEvent.create({
        data: {
          organizationId: remediation.organizationId,
          actorUserId: principal.userId,
          action: "REMEDIATION_VERIFICATION_RECORDED",
          resourceType: "workspace_verification",
          resourceId: created.id,
          requestId,
          metadata: {
            remediationId,
            findingId: currentRemediation.findingId,
            result: parsed.data.result,
            method: parsed.data.method,
            evidenceId: parsed.data.evidenceId ?? null,
            independentVerifier: true,
          },
        },
      });
      return created;
    });

    return NextResponse.json({
      status: parsed.data.result === "PASS" ? "verified" : "verification_failed",
      verificationId: verification.id,
      result: parsed.data.result,
      requestId,
    }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    console.error("workspace_verification_failed", { requestId, remediationId, error });
    return NextResponse.json({ error: "verification_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
