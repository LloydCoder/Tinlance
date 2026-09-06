import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const requestId = getRequestId(request); const { reportId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, "report:read")) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const report = await db.workspaceReport.findUnique({ where: { id: reportId }, select: { id: true, organizationId: true, projectId: true, title: true, type: true, currentVersion: true, status: true, summary: true, generatedAt: true, publishedAt: true, contentHash: true } });
  if (!report || (!principal.isPrivileged && report.organizationId !== principal.organizationId) || (!principal.isPrivileged && !["APPROVED","PUBLISHED","SUPERSEDED"].includes(report.status))) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const version = await db.workspaceReportVersion.findUnique({ where: { reportId_version: { reportId, version: report.currentVersion } }, select: { version: true, content: true, contentHash: true, createdAt: true } });
  if (!version || createHash("sha256").update(version.content).digest("hex") !== version.contentHash) return NextResponse.json({ error: "report_integrity_failure", requestId }, { status: 500, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  await db.auditEvent.create({ data: { organizationId: report.organizationId, actorUserId: principal.userId, action: "REPORT_VIEWED", resourceType: "workspace_report", resourceId: report.id, requestId, metadata: { version: version.version } } });
  return new NextResponse(version.content, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:;", "x-request-id": requestId } });
}
