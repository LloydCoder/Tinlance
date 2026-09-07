import { NextResponse } from "next/server";
import { WorkspaceFindingSeverity, WorkspaceVisibility } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({
  assessmentId: z.string().min(1), title: z.string().trim().min(3).max(240), description: z.string().trim().min(10).max(20000), category: z.string().trim().min(2).max(120), severity: z.nativeEnum(WorkspaceFindingSeverity), likelihood: z.string().trim().max(50).optional(), impact: z.string().trim().max(1000).optional(), riskScore: z.number().min(0).max(100000).optional(), riskMethodology: z.string().trim().max(240).optional(), affectedAsset: z.string().trim().max(500).optional(), recommendation: z.string().trim().min(10).max(20000), ownerUserId: z.string().trim().min(1).optional(), dueDate: z.string().datetime().optional(), authorship: z.enum(["HUMAN_AUTHORED","AI_ASSISTED","AI_GENERATED","HUMAN_VERIFIED"]).default("HUMAN_AUTHORED"), evidenceIds: z.array(z.string().min(1)).max(50).default([]), idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "finding:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const findings = await db.workspaceFinding.findMany({ where: { projectId, organizationId: authorized.project.organizationId, ...(authorized.principal.isPrivileged ? {} : { visibility: { in: [WorkspaceVisibility.CUSTOMER, WorkspaceVisibility.CUSTOMER_CONFIDENTIAL] } }) }, orderBy: [{ severity: "asc" }, { createdAt: "desc" }], take: 100 });
  return NextResponse.json({ findings, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "finding:create");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const assessment = await db.workspaceAssessment.findFirst({ where: { id: parsed.data.assessmentId, projectId, organizationId: authorized.project.organizationId }, select: { id: true, assessmentId: true } });
  if (!assessment) return NextResponse.json({ error: "assessment_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (parsed.data.ownerUserId) { const member = await db.member.findUnique({ where: { organizationId_userId: { organizationId: authorized.project.organizationId, userId: parsed.data.ownerUserId } }, select: { userId: true } }); if (!member) return NextResponse.json({ error: "owner_not_in_organization", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  const evidence = parsed.data.evidenceIds.length ? await db.workspaceEvidence.findMany({ where: { id: { in: parsed.data.evidenceIds }, projectId, organizationId: authorized.project.organizationId }, select: { id: true } }) : [];
  if (evidence.length !== parsed.data.evidenceIds.length) return NextResponse.json({ error: "evidence_scope_mismatch", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (parsed.data.idempotencyKey) { const existing = await db.workspaceFinding.findUnique({ where: { idempotencyKey: parsed.data.idempotencyKey }, select: { id: true, projectId: true, organizationId: true } }); if (existing) { if (existing.projectId !== projectId || existing.organizationId !== authorized.project.organizationId) return NextResponse.json({ error: "idempotency_conflict", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); return NextResponse.json({ status: "duplicate", findingId: existing.id, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); } }
  try {
    const finding = await db.$transaction(async (tx) => {
      const created = await tx.workspaceFinding.create({ data: { organizationId: authorized.project.organizationId, projectId, assessmentId: assessment.assessmentId, title: parsed.data.title, description: parsed.data.description, category: parsed.data.category, severity: parsed.data.severity, likelihood: parsed.data.likelihood, impact: parsed.data.impact, riskScore: parsed.data.riskScore, riskMethodology: parsed.data.riskMethodology, affectedAsset: parsed.data.affectedAsset, recommendation: parsed.data.recommendation, ownerUserId: parsed.data.ownerUserId || null, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null, authorship: parsed.data.authorship, idempotencyKey: parsed.data.idempotencyKey || null } });
      if (evidence.length) await tx.workspaceFindingEvidence.createMany({ data: evidence.map((item) => ({ findingId: created.id, evidenceId: item.id })) });
      await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "FINDING_CREATED", resourceType: "workspace_finding", resourceId: created.id, requestId, metadata: { projectId, assessmentId: parsed.data.assessmentId, severity: created.severity, evidenceCount: evidence.length, authorship: created.authorship } } });
      return created;
    });
    return NextResponse.json({ status: "created", findingId: finding.id, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) { console.error("workspace_finding_create_failed", { requestId, projectId, error }); return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
