import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorizeProject } from "@/lib/workspace/authorization";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const requestId = getRequestId(request); const { projectId } = await context.params; const authorized = await authorizeProject(projectId, "team:read");
  if (!authorized) return NextResponse.json({ error: "not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  const members = await db.member.findMany({ where: { organizationId: authorized.project.organizationId }, select: { role: true, user: { select: { id: true, name: true, email: true } } }, orderBy: { user: { name: "asc" } }, take: 100 });
  return NextResponse.json({ members, requestId }, { headers: { "cache-control": "private, no-store", "x-request-id": requestId } });
}
