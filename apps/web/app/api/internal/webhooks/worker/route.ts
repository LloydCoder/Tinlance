import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { request as httpsRequest } from "node:https";
import { lookup } from "node:dns/promises";
import { db } from "@/lib/db";
import { decryptSecret, assertSafeWebhookUrl, signWebhook } from "@/lib/api/webhooks";

export const maxDuration = 300;

function authorized(request: Request) { const secret = process.env.CRON_SECRET; const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim(); return Boolean(secret && provided && provided === secret); }
async function deliver(url: string, headers: Record<string, string>, body: string) {
  const parsed = await assertSafeWebhookUrl(url); const resolved = await lookup(parsed.hostname, { all: true }); const target = resolved.find((item) => item.family === 4) ?? resolved[0]; if (!target) throw new Error("Webhook host could not be resolved");
  return await new Promise<number>((resolve, reject) => {
    const req = httpsRequest({ protocol: "https:", hostname: target.address, port: parsed.port || 443, path: `${parsed.pathname}${parsed.search}`, method: "POST", servername: parsed.hostname, headers: { ...headers, host: parsed.host, "content-length": Buffer.byteLength(body).toString() }, timeout: 10000, rejectUnauthorized: true }, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode ?? 599)); });
    req.on("timeout", () => req.destroy(new Error("webhook timeout"))); req.on("error", reject); req.write(body); req.end();
  });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deliveries = await db.$queryRaw<Array<{ id: string; endpointId: string; eventId: string; attempts: number }>>(Prisma.sql`SELECT id,"endpointId","eventId",attempts FROM "ApiWebhookDelivery" WHERE status IN ('PENDING','RETRYING') AND "nextAttemptAt" <= CURRENT_TIMESTAMP ORDER BY "nextAttemptAt" ASC FOR UPDATE SKIP LOCKED LIMIT 25`).catch(() => []);
  let processed = 0;
  for (const delivery of deliveries) {
    const rows = await db.$queryRaw<Array<{ url: string; secretCiphertext: string | null; active: boolean; organizationId: string; type: string; version: number; resourceType: string; resourceId: string; data: unknown; createdAt: Date }>>(Prisma.sql`SELECT e.url,e."secretCiphertext",e.active,e."organizationId",v.type,v.version,v."resourceType",v."resourceId",v.data,v."createdAt" FROM "ApiWebhookEndpoint" e JOIN "ApiEvent" v ON v.id=${delivery.eventId} WHERE e.id=${delivery.endpointId} LIMIT 1`);
    const row = rows[0]; if (!row?.active || !row.secretCiphertext) { await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookDelivery" SET status='DEAD',"updatedAt"=CURRENT_TIMESTAMP WHERE id=${delivery.id}`); continue; }
    const envelope = JSON.stringify({ id: delivery.eventId, type: row.type, version: row.version, createdAt: row.createdAt.toISOString(), organizationId: row.organizationId, resource: { type: row.resourceType, id: row.resourceId }, data: row.data }); const timestamp = Math.floor(Date.now() / 1000); let status = 599; let errorMessage: string | null = null;
    try { status = await deliver(row.url, { "content-type": "application/json", "user-agent": "Tinlance-Webhooks/1.0", "x-tinlance-webhook-id": delivery.id, "x-tinlance-event": row.type, "x-tinlance-timestamp": String(timestamp), "x-tinlance-signature": signWebhook(decryptSecret(row.secretCiphertext), timestamp, envelope) }, envelope); } catch (error) { errorMessage = error instanceof Error ? error.message : "delivery failed"; }
    if (status >= 200 && status < 300) {
      await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookDelivery" SET status='DELIVERED',attempts=attempts+1,"deliveredAt"=CURRENT_TIMESTAMP,"lastStatusCode"=${status},"lastError"=NULL,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${delivery.id}`);
      await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookEndpoint" SET "failureCount"=0,"lastDeliveredAt"=CURRENT_TIMESTAMP,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${delivery.endpointId}`); processed++; continue;
    }
    const nextAttempt = delivery.attempts + 1; const terminal = nextAttempt >= 10; const delaySeconds = Math.min(3600, 2 ** Math.min(nextAttempt, 10));
    await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookDelivery" SET status=${terminal ? "DEAD" : "RETRYING"},attempts=${nextAttempt},"lastStatusCode"=${status},"lastError"=${errorMessage ?? `HTTP ${status}`},"nextAttemptAt"=CURRENT_TIMESTAMP + make_interval(secs => ${delaySeconds}),"updatedAt"=CURRENT_TIMESTAMP WHERE id=${delivery.id}`);
    await db.$executeRaw(Prisma.sql`UPDATE "ApiWebhookEndpoint" SET "failureCount"="failureCount"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${delivery.endpointId}`);
  }
  return NextResponse.json({ ok: true, processed, scanned: deliveries.length }, { headers: { "cache-control": "no-store" } });
}
