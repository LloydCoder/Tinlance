import { NextResponse } from "next/server";
import { WorkspaceFindingStatus } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getWorkspacePrincipal, hasWorkspacePermission } from "@/lib/workspace/authorization";
import { transitionFinding } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ to: z.nativeEnum(WorkspaceFindingStatus) });

export async function POST(request: Request, context: { params: Promise<{ findingId: string }> }) {
  const requestId = getRequestId(request); const { findingId } = await context.params; const principal = await getWorkspacePrincipal();
  if (!principal) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const finding = await db.workspaceFinding.findUnique({ where: { id: findingId }, select: { organizationId: true } });
  if (!finding || (!principal.isPrivileged && finding.organizationId !== principal.organizationId)) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const body = schema.safeParse(await request.json()); if (!body.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const permission = ["CUSTOMER_VISIBLE","OPEN","ACKNOWLEDGED","IN_PROGRESS","REMEDIATED","VERIFICATION_PENDING","VERIFIED","CLOSED"].includes(body.data.to) ? "finding:publish" : "finding:update";
  if (!hasWorkspacePermission(principal, permission)) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try { const result = await transitionFinding({ findingId, organizationId: finding.organizationId, actorUserId: principal.userId, to: body.data.to, requestId }); return NextResponse.json({ ...result, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  catch (error) { const message = error instanceof Error ? error.message : ""; if (message.startsWith("Invalid finding transition")) return NextResponse.json({ error: "invalid_transition", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); return NextResponse.json({ error: "transition_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
