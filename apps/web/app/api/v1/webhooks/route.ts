import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateApi, ok, problem } from "@/lib/api/v1";
import { assertSafeWebhookUrl, encryptSecret } from "@/lib/api/webhooks";

const events = ["project.created", "assessment.created", "assessment.completed", "finding.created", "evidence.uploaded", "report.published", "remediation.created", "remediation.verified", "workflow.started", "workflow.completed", "workflow.failed"] as const;
const schema = z.object({ url: z.string().url().max(2048), description: z.string().trim().max(500).optional(), eventTypes: z.array(z.enum(events)).min(1).max(events.length) }).strict();

export async function GET(request: Request) {
  const auth = await authenticateApi(request, "webhooks:read"); if ("response" in auth) return auth.response;
  const rows = await db.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT id,url,description,"eventTypes","active","failureCount","lastDeliveredAt","disabledAt","createdAt","updatedAt" FROM "ApiWebhookEndpoint" WHERE "organizationId"=${auth.principal.organizationId} ORDER BY "createdAt" DESC LIMIT 100`);
  return ok(request, rows);
}

export async function POST(request: Request) {
  const auth = await authenticateApi(request, "webhooks:write"); if ("response" in auth) return auth.response; let body; try { body = schema.parse(await request.json()); } catch { return problem(auth.principal.requestId, 422, "validation_failed", "Invalid webhook request"); }
  try { await assertSafeWebhookUrl(body.url); } catch (error) { return problem(auth.principal.requestId, 422, "webhook_url_rejected", "Webhook URL is not allowed", error instanceof Error ? error.message : "Invalid webhook URL"); }
  const secret = `whsec_${randomBytes(32).toString("base64url")}`; const id = `wh_${randomUUID().replaceAll("-", "")}`; const prefix = secret.slice(0, 14);
  await db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`INSERT INTO "ApiWebhookEndpoint" ("id","organizationId","url","description","secretHash","secretPrefix","secretCiphertext","eventTypes","active","createdAt","updatedAt") VALUES (${id},${auth.principal.organizationId},${body.url},${body.description ?? null},${createHash("sha256").update(secret).digest("hex")},${prefix},${encryptSecret(secret)},${JSON.stringify(body.eventTypes)}::jsonb,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`);
    await tx.auditEvent.create({ data: { organizationId: auth.principal.organizationId, actorUserId: auth.principal.userId, action: "WEBHOOK_CREATED", resourceType: "api_webhook_endpoint", resourceId: id, requestId: auth.principal.requestId, metadata: { eventTypes: body.eventTypes } } });
  });
  return ok(request, { id, url: body.url, eventTypes: body.eventTypes, active: true, secret, warning: "Store this webhook secret now. Tinlance will not display it again." }, 201);
}
