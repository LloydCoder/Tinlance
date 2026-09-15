import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = session?.session.activeOrganizationId;
  if (!session?.user?.id || !organizationId) {
    return NextResponse.json({ error: "authentication_required", requestId }, { status: 401 });
  }

  // TOTP step-up is intentionally unavailable until the Better Auth 2FA
  // plugin and its production database schema are provisioned together.
  // Never mint a step-up token without an actual second-factor verification.
  return NextResponse.json(
    { error: "step_up_unavailable", message: "MFA step-up is not provisioned", requestId },
    { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
