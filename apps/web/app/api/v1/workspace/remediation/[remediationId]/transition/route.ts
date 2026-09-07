import { NextResponse } from "next/server";
import { WorkspaceRemediationStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { transitionRemediation } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ to: z.nativeEnum(WorkspaceRemediationStatus) });

export async function POST(request: Request, context: { params: Promise<{ remediationId: string }> }) {
  const requestId = getRequestId(request); const { remediationId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const remediation = await db.workspaceRemediation.findUnique({ where: { id: remediationId }, select: { organizationId: true } });
  if (!remediation || (!principal.isPrivileged && remediation.organizationId !== principal.organizationId)) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const privilegedOnly = ["READY_FOR_VERIFICATION","VERIFIED","CLOSED"].includes(parsed.data.to);
  const permission = privilegedOnly ? "remediation:verify" : "remediation:update";
  if (!hasWorkspacePermission(principal, permission)) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try { const result = await transitionRemediation({ remediationId, organizationId: remediation.organizationId, actorUserId: principal.userId, to: parsed.data.to, requestId }); return NextResponse.json({ ...result, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  catch (error) { const message = error instanceof Error ? error.message : ""; if (message.startsWith("Invalid remediation transition")) return NextResponse.json({ error: "invalid_transition", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); return NextResponse.json({ error: "transition_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
