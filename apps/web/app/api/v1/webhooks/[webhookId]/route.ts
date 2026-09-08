import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { encryptSecret } from "@/lib/api/webhooks";

export async function DELETE(request: Request, context: { params: Promise<{ webhookId: string }> }) {
  const auth = await authenticateApi(request, "webhooks:write"); if ("response" in auth) return auth.response; const { webhookId } = await context.params;
  const result = await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookEndpoint" SET "active"=false,"disabledAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${webhookId} AND "organizationId"=${auth.principal.organizationId}`);
  if (result === 0) return problem(auth.principal.requestId, 404, "resource_not_found", "Webhook not found");
  await db.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "WEBHOOK_DISABLED", resourceType: "api_webhook_endpoint", resourceId: webhookId, requestId: auth.principal.requestId, metadata: {} } });
  return ok(request, { id: webhookId, active: false });
}

export async function POST(request: Request, context: { params: Promise<{ webhookId: string }> }) {
  const auth = await authenticateApi(request, "webhooks:write"); if ("response" in auth) return auth.response; const { webhookId } = await context.params;
  const secret = `whsec_${randomBytes(32).toString("base64url")}`; const prefix = secret.slice(0, 14);
  const result = await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookEndpoint" SET "secretHash"=${createHash("sha256").update(secret).digest("hex")},"secretPrefix"=${prefix},"secretCiphertext"=${encryptSecret(secret)},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${webhookId} AND "organizationId"=${auth.principal.organizationId}`);
  if (result === 0) return problem(auth.principal.requestId, 404, "resource_not_found", "Webhook not found");
  await db.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "WEBHOOK_SECRET_ROTATED", resourceType: "api_webhook_endpoint", resourceId: webhookId, requestId: auth.principal.requestId, metadata: {} } });
  return ok(request, { id: webhookId, secret, warning: "Store this webhook secret now. Tinlance will not display it again." });
}
