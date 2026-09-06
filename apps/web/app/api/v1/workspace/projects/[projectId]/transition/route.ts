import { NextResponse } from "next/server";
import { ProjectWorkspaceStatus } from "@prisma/client";
import { z } from "zod";
import { authorizeProject } from "@/lib/workspace/authorization";
import { transitionProject } from "@/lib/workspace/service";
import { ensureProjectWorkspaceState } from "@/lib/workspace/service";
import { getRequestId } from "@/lib/security/request-id";

const schema = z.object({ to: z.nativeEnum(ProjectWorkspaceStatus) });

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "project:transition");
  if (!authorized) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  await ensureProjectWorkspaceState(projectId, authorized.project.organizationId);
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  try { const result = await transitionProject({ projectId, organizationId: authorized.project.organizationId, actorUserId: authorized.principal.userId, to: parsed.data.to, requestId }); return NextResponse.json({ ...result, requestId }, { headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  catch (error) { const message = error instanceof Error ? error.message : ""; if (message.startsWith("Invalid project transition")) return NextResponse.json({ error: "invalid_transition", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); return NextResponse.json({ error: "transition_failed", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
}
