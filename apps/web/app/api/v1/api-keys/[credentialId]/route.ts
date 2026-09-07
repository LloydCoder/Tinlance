import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { problem, ok } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";

export async function DELETE(request: Request, context: { params: Promise<{ credentialId: string }> }) {
  const requestId = getRequestId(request); const session = await auth.api.getSession({ headers: await headers() });
  const { credentialId } = await context.params;
  if (!session?.session.activeOrganizationId) return problem(requestId, 401, "authentication_required", "Authentication required");
  const member = await db.member.findUnique({ where: { organizationId_userId: { organizationId: session.session.activeOrganizationId, userId: session.user.id } }, select: { role: true } });
  if (!member || !["owner", "admin", "client-admin"].includes(member.role)) return problem(requestId, 403, "authorization_denied", "API credential administration is not permitted");
  const result = await db.$executeRaw(Prisma.sql`UPDATE "ApiCredential" SET "revokedAt"=COALESCE("revokedAt",CURRENT_TIMESTAMP),"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${credentialId} AND "organizationId"=${session.session.activeOrganizationId}`);
  if (result === 0) return problem(requestId, 404, "resource_not_found", "API credential not found");
  await db.auditEvent.create({ data: { organizationId: session.session.activeOrganizationId, actorUserId: session.user.id, action: "API_KEY_REVOKED", resourceType: "api_credential", resourceId: credentialId, requestId, metadata: {} } });
  return ok(request, { id: credentialId, revoked: true }, 200);
}
