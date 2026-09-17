import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";

type AuditInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  actorServiceId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
};

function hash(value: string | null | undefined) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

export async function recordSecurityAuditEvent(input: AuditInput) {
  const id = randomUUID();
  await db.$executeRaw`
    INSERT INTO "securityAuditEvent" (
      "id", "organizationId", "actorUserId", "actorServiceId", "action",
      "targetType", "targetId", "requestId", "ipHash", "userAgentHash",
      "metadata", "createdAt"
    ) VALUES (
      ${id}, ${input.organizationId ?? null}, ${input.actorUserId ?? null},
      ${input.actorServiceId ?? null}, ${input.action}, ${input.targetType ?? null},
      ${input.targetId ?? null}, ${input.requestId ?? null},
      ${hash(input.ipAddress)}, ${hash(input.userAgent)},
      ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, NOW()
    )
  `;
}
