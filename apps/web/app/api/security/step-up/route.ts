import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = session?.session.activeOrganizationId;
  if (!session?.user?.id || !organizationId) return NextResponse.json({ error: "authentication_required", requestId }, { status: 401 });
  let body: { code?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_json", requestId }, { status: 400 }); }
  if (!body.code || !/^\d{6}$/.test(body.code)) return NextResponse.json({ error: "invalid_code", requestId }, { status: 400 });
  const verification = await auth.api.verifyTOTP({ body: { code: body.code, trustDevice: false }, headers: await headers() });
  if (!verification) return NextResponse.json({ error: "step_up_failed", requestId }, { status: 403 });
  const token = `step_${randomUUID().replaceAll("-", "")}`;
  await db.$executeRaw`INSERT INTO "SecurityStepUp" ("id","organizationId","userId","verifiedAt","expiresAt","createdAt") VALUES (${token},${organizationId},${session.user.id},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP + INTERVAL '10 minutes',CURRENT_TIMESTAMP)`;
  return NextResponse.json({ stepUpToken: token, expiresInSeconds: 600, requestId }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
