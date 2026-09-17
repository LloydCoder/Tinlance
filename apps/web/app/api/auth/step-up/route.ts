import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordSecurityAuditEvent } from "@/lib/auth/audit";
import { requirePrivileged } from "@/lib/auth/authorization";
import { db } from "@/lib/db";

const STEP_UP_TTL_SECONDS = 15 * 60;

export async function POST(request: Request) {
  const context = await requirePrivileged({ requireMfa: true });
  if (!context?.organizationId || !context.sessionId || !context.userId) {
    return NextResponse.json({ error: "privileged_session_required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const code = typeof body === "object" && body !== null && "code" in body
    ? (body as { code?: unknown }).code
    : undefined;

  if (typeof code !== "string" || !/^\d{6,8}$/.test(code)) {
    return NextResponse.json({ error: "invalid_totp_code" }, { status: 400 });
  }

  try {
    const verification = await auth.api.verifyTOTP({
      body: { code },
      headers: request.headers,
    });

    if (!verification || verification.status !== true) {
      return NextResponse.json({ error: "step_up_verification_failed" }, { status: 401 });
    }

    const challengeId = randomBytes(16).toString("hex");
    const nonce = randomBytes(32).toString("base64url");
    const nonceHash = createHash("sha256").update(nonce).digest("hex");

    await db.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "stepUpChallenge"
        SET "expiresAt" = NOW()
        WHERE "userId" = ${context.userId}
          AND "sessionId" = ${context.sessionId}
          AND "verifiedAt" IS NOT NULL
          AND "expiresAt" > NOW()
      `;
      await tx.$executeRaw`
        INSERT INTO "stepUpChallenge" (
          "id", "organizationId", "userId", "sessionId", "method",
          "nonceHash", "issuedAt", "expiresAt", "verifiedAt", "createdAt"
        ) VALUES (
          ${challengeId}, ${context.organizationId}, ${context.userId},
          ${context.sessionId}, 'totp', ${nonceHash}, NOW(),
          NOW() + (${STEP_UP_TTL_SECONDS} * INTERVAL '1 second'), NOW(), NOW()
        )
      `;
    });

    await recordSecurityAuditEvent({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      action: "auth.step_up.verified",
      targetType: "session",
      targetId: context.sessionId,
      requestId: request.headers.get("x-request-id"),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
      metadata: { method: "totp", ttlSeconds: STEP_UP_TTL_SECONDS },
    });

    return NextResponse.json({
      verified: true,
      expiresInSeconds: STEP_UP_TTL_SECONDS,
    });
  } catch (error) {
    console.error("[auth] step-up verification failed", error);
    return NextResponse.json({ error: "step_up_verification_failed" }, { status: 401 });
  }
}
