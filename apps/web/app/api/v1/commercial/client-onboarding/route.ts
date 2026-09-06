import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hashProposalToken } from "@/lib/commercial/security";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { getClientIp } from "@/lib/security/client-ip";
import { enforcePublicRateLimit } from "@/lib/security/rate-limit";

const inputSchema = z.object({ token: z.string().min(32).max(128), name: z.string().trim().min(2).max(120), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const limit = await enforcePublicRateLimit(`client-onboarding:${getClientIp(request)}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited", requestId }, { status: 429, headers: { "cache-control": "no-store", "retry-after": String(limit.retryAfter ?? 60), "x-request-id": requestId } });
  try {
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "invalid_request", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    const invite = await db.clientAccessInvite.findUnique({ where: { tokenHash: hashProposalToken(parsed.data.token) }, include: { client: { select: { organizationId: true } } } });
    if (!invite) return NextResponse.json({ error: "invite_not_found", requestId }, { status: 404, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (invite.acceptedAt) return NextResponse.json({ error: "invite_already_used", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    if (invite.expiresAt <= new Date()) return NextResponse.json({ error: "invite_expired", requestId }, { status: 410, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    let user = await db.user.findUnique({ where: { email: invite.email }, select: { id: true } });
    if (!user) {
      const signup = await auth.api.signUpEmail({ body: { name: parsed.data.name, email: invite.email, password: parsed.data.password } });
      user = signup.user ? { id: signup.user.id } : null;
    }
    if (!user) return NextResponse.json({ error: "account_creation_failed", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });

    await db.$transaction(async (tx) => {
      await tx.member.upsert({ where: { organizationId_userId: { organizationId: invite.client.organizationId, userId: user.id } }, update: { role: "client-admin" }, create: { organizationId: invite.client.organizationId, userId: user.id, role: "client-admin" } });
      const updated = await tx.clientAccessInvite.updateMany({ where: { id: invite.id, acceptedAt: null }, data: { acceptedAt: new Date() } });
      if (updated.count !== 1) throw new Error("invite_race");
      await tx.auditEvent.create({ data: { organizationId: invite.client.organizationId, actorUserId: user.id, action: "client.onboarding_completed", resourceType: "client", resourceId: invite.clientId, requestId, metadata: { email: invite.email } } });
    });

    return NextResponse.json({ status: "activated", requestId, redirectTo: "/sign-in?callbackURL=/portal" }, { status: 201, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "account_already_exists", requestId }, { status: 409, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("client_onboarding_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
