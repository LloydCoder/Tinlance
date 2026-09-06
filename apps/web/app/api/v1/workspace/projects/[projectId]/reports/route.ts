import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { generateAssessmentReport } from "@/lib/workspace/report";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "report:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const reports = await db.workspaceReport.findMany({ where: { projectId, organizationId: authorized.project.organizationId, ...(authorized.principal.isPrivileged ? {} : { status: { in: ["APPROVED","PUBLISHED","SUPERSEDED"] } }) }, orderBy: { createdAt: "desc" }, take: 50, select: { id: true, title: true, type: true, currentVersion: true, status: true, summary: true, generatedAt: true, publishedAt: true, publishedByUserId: true, contentHash: true, createdAt: true } });
  return NextResponse.json({ reports, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "report:create");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const body = await request.json().catch(() => ({})) as { assessmentId?: string; title?: string; type?: string };
  const assessmentId = body.assessmentId?.trim(); const title = body.title?.trim(); const type = body.type?.trim() || "Technical Assessment";
  if (!assessmentId || !title || title.length > 240) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const assessment = await db.workspaceAssessment.findFirst({ where: { id: assessmentId, projectId, organizationId: authorized.project.organizationId }, select: { id: true, type: true, objective: true, methodology: true, startedAt: true, completedAt: true } });
  if (!assessment) return NextResponse.json({ error: "assessment_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const findings = await db.workspaceFinding.findMany({ where: { assessmentId, projectId, organizationId: authorized.project.organizationId, visibility: { in: ["CUSTOMER","CUSTOMER_CONFIDENTIAL"] }, status: { notIn: ["DRAFT_INTERNAL","REVIEW"] } }, orderBy: [{ severity: "asc" }, { createdAt: "asc" }], select: { id: true, title: true, description: true, severity: true, category: true, affectedAsset: true, recommendation: true } });
  const findingLinks = findings.length ? await db.workspaceFindingEvidence.findMany({ where: { findingId: { in: findings.map((f) => f.id) } }, select: { findingId: true, evidenceId: true } }) : [];
  const evidenceIds = [...new Set(findingLinks.map((link) => link.evidenceId))];
  const evidence = evidenceIds.length ? await db.workspaceEvidence.findMany({ where: { id: { in: evidenceIds }, organizationId: authorized.project.organizationId, projectId, visibility: { in: ["CUSTOMER","CUSTOMER_CONFIDENTIAL"] }, integrityStatus: "VERIFIED" }, select: { id: true, title: true, contentHash: true, type: true } }) : [];
  const remediation = findings.length ? await db.workspaceRemediation.findMany({ where: { findingId: { in: findings.map((f) => f.id) }, organizationId: authorized.project.organizationId }, select: { findingId: true, title: true, status: true, priority: true } }) : [];
  const generated = generateAssessmentReport({ title, projectName: authorized.project.name, assessmentType: assessment.type, assessmentPeriod: `${assessment.startedAt?.toISOString() ?? "not recorded"} — ${assessment.completedAt?.toISOString() ?? "not recorded"}`, objective: assessment.objective, methodology: assessment.methodology, findings, evidence, remediation });
  const report = await db.$transaction(async (tx) => {
    const created = await tx.workspaceReport.create({ data: { organizationId: authorized.project.organizationId, projectId, assessmentId, title, type, status: "DRAFT", currentVersion: 1, summary: `Evidence-backed report containing ${findings.length} customer-visible findings and ${evidence.length} verified evidence items.`, generatedAt: new Date(), contentHash: generated.contentHash } });
    await tx.workspaceReportVersion.create({ data: { reportId: created.id, version: 1, content: generated.content, contentHash: generated.contentHash, createdByUserId: authorized.principal.userId } });
    await tx.auditEvent.create({ data: { organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, action: "REPORT_CREATED", resourceType: "workspace_report", resourceId: created.id, requestId, metadata: { projectId, assessmentId, version: 1, contentHash: generated.contentHash, findingCount: findings.length, evidenceCount: evidence.length } } });
    return created;
  });
  return NextResponse.json({ status: "created", reportId: report.id, version: 1, contentHash: generated.contentHash, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
