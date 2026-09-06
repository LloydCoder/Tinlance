import { NextResponse } from "next/server";
import { WorkspaceReportStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { transitionReport } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ to: z.nativeEnum(WorkspaceReportStatus) });

export async function POST(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const requestId = getRequestId(request); const { reportId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const report = await db.workspaceReport.findUnique({ where: { id: reportId }, select: { organizationId: true } });
  if (!report || (!principal.isPrivileged && report.organizationId !== principal.organizationId)) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const permission = parsed.data.to === "PUBLISHED" ? "report:publish" : "report:create";
  if (!hasWorkspacePermission(principal, permission)) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try { const result = await transitionReport({ reportId, organizationId: report.organizationId, actorUserId: principal.userId, to: parsed.data.to, requestId }); return NextResponse.json({ ...result, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  catch (error) { const message = error instanceof Error ? error.message : ""; if (message.startsWith("Invalid report transition")) return NextResponse.json({ error: "invalid_transition", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); return NextResponse.json({ error: "transition_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
