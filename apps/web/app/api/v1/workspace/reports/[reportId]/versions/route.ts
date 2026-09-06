import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ content: z.string().min(1).max(2_000_000) });

export async function POST(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const requestId = getRequestId(request); const { reportId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal || !hasWorkspacePermission(principal, "report:create") || !principal.isPrivileged) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const report = await db.workspaceReport.findUnique({ where: { id: reportId }, select: { id: true, organizationId: true, projectId: true, currentVersion: true, status: true } });
  if (!report || report.organizationId !== principal.organizationId) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const version = report.currentVersion + 1; const contentHash = createHash("sha256").update(parsed.data.content).digest("hex");
  await db.$transaction(async (tx) => {
    await tx.workspaceReportVersion.create({ data: { reportId, version, content: parsed.data.content, contentHash, createdByUserId: principal.userId } });
    await tx.workspaceReport.update({ where: { id: reportId }, data: { currentVersion: version, status: "DRAFT", contentHash, generatedAt: new Date(), publishedAt: null, publishedByUserId: null } });
    await tx.auditEvent.create({ data: { organizationId: report.organizationId, actorUserId: principal.userId, action: "REPORT_VERSION_CREATED", resourceType: "workspace_report", resourceId: reportId, requestId, metadata: { previousVersion: report.currentVersion, version, contentHash, previousStatus: report.status } } });
  });
  return NextResponse.json({ status: "draft_created", reportId, version, contentHash, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
