import { createHash } from "node:crypto";
import { db } from "@/lib/db";

function notificationKey(action: string, resourceId: string) {
  return createHash("sha256").update(`${action}:${resourceId}`).digest("hex");
}

export async function sendCommercialEmail(input: {
  action: string;
  resourceId: string;
  to: string;
  subject: string;
  html: string;
  requestId?: string;
  organizationId?: string | null;
}) {
  const key = notificationKey(input.action, input.resourceId);
  const existing = await db.auditEvent.findFirst({
    where: { action: `notification.${input.action}`, resourceId: input.resourceId, metadata: { path: ["notificationKey"], equals: key } },
    select: { id: true },
  });
  if (existing) return { sent: false, duplicate: true };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    await db.auditEvent.create({ data: { organizationId: input.organizationId ?? null, action: `notification.${input.action}`, resourceType: "notification", resourceId: input.resourceId, requestId: input.requestId, metadata: { notificationKey: key, outcome: "not_configured" } } });
    return { sent: false, duplicate: false, configured: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    await db.auditEvent.create({ data: { organizationId: input.organizationId ?? null, action: `notification.${input.action}.failed`, resourceType: "notification", resourceId: input.resourceId, requestId: input.requestId, metadata: { notificationKey: key, status: response.status, detail: detail.slice(0, 500) } } });
    return { sent: false, duplicate: false, configured: true };
  }

  await db.auditEvent.create({ data: { organizationId: input.organizationId ?? null, action: `notification.${input.action}`, resourceType: "notification", resourceId: input.resourceId, requestId: input.requestId, metadata: { notificationKey: key, outcome: "sent" } } });
  return { sent: true, duplicate: false, configured: true };
}
