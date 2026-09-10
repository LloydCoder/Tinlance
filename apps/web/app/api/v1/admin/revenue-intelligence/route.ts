import { NextResponse } from "next/server";
import { getAuthorizationContext } from "@/lib/auth/authorization";
import { getRevenueIntelligence } from "@/lib/revenue-intelligence";
import { getRequestId } from "@/lib/security/request-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const context = await getAuthorizationContext();
  if (!context.isAuthenticated) return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  if (!context.isPrivileged) return NextResponse.json({ error: "forbidden", requestId }, { status: 403, headers: { "cache-control": "no-store", "x-request-id": requestId } });

  try {
    const url = new URL(request.url);
    const data = await getRevenueIntelligence({ from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined, days: Number(url.searchParams.get("days") ?? 90) });
    return NextResponse.json(data, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof Error && error.message === "invalid_date_range") return NextResponse.json({ error: "invalid_date_range", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } });
    console.error("revenue_intelligence_failed", { requestId, error });
    return NextResponse.json({ error: "service_unavailable", requestId }, { status: 503, headers: { "cache-control": "no-store", "x-request-id": requestId } });
  }
}
