import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const USAGE_METRICS = [
  "api_requests",
  "assessment_executions",
  "mcp_calls",
  "agent_executions",
  "reports_generated",
] as const;
export type UsageMetric = (typeof USAGE_METRICS)[number];

export async function recordUsage(input: {
  organizationId: string;
  requestId: string;
  credentialId?: string | null;
  metric: UsageMetric;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  const quantity = input.quantity ?? 1;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000)
    throw new Error("invalid_usage_quantity");
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "UsageEvent" ("id","organizationId","requestId","credentialId","metric","quantity","unit","metadata") VALUES (${`use_${randomUUID().replaceAll("-", "")}`},${input.organizationId},${input.requestId},${input.credentialId ?? null},${input.metric},${quantity},${input.metric},${JSON.stringify(input.metadata ?? {})}::jsonb) ON CONFLICT ("requestId","metric") DO NOTHING`,
  );
}

export async function getUsageSummary(input: {
  organizationId: string;
  from: Date;
  to: Date;
}) {
  const rows = await db.$queryRaw<Array<{ metric: string; quantity: bigint }>>(
    Prisma.sql`SELECT "metric",SUM("quantity")::bigint AS quantity FROM "UsageEvent" WHERE "organizationId"=${input.organizationId} AND "occurredAt">=${input.from} AND "occurredAt"<${input.to} GROUP BY "metric" ORDER BY "metric"`,
  );
  const rates = await db.$queryRaw<
    Array<{
      metric: string;
      includedQuantity: bigint;
      unitPriceMinor: bigint;
      unit: string;
      currency: string;
    }>
  >(
    Prisma.sql`SELECT r."metric",r."includedQuantity",r."unitPriceMinor",r."unit",p."currency" FROM "OrganizationUsagePlan" op JOIN "UsagePlan" p ON p.id=op."planId" AND p.active=true JOIN "UsagePlanRate" r ON r."planId"=p.id WHERE op."organizationId"=${input.organizationId}`,
  );
  const rateMap = new Map(rates.map((r) => [r.metric, r]));
  return rows.map((row) => {
    const rate = rateMap.get(row.metric);
    const quantity = Number(row.quantity);
    const included = rate ? Number(rate.includedQuantity) : 0;
    const billable = Math.max(0, quantity - included);
    return {
      metric: row.metric,
      quantity,
      includedQuantity: included,
      billableQuantity: billable,
      unitPriceMinor: rate ? Number(rate.unitPriceMinor) : 0,
      estimatedChargeMinor: billable * (rate ? Number(rate.unitPriceMinor) : 0),
      unit: rate?.unit ?? row.metric,
      currency: rate?.currency ?? null,
    };
  });
}
