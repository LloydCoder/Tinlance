import { NextResponse } from "next/server";
import { processOutboxBatch } from "@/lib/platform/outbox";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron_not_configured" }, { status: 503 });
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const result = await processOutboxBatch();
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
