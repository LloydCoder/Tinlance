import { NextResponse } from "next/server";
import { getPublicCapabilities } from "@/lib/platform/registry";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ schemaVersion: "1.0", generatedAt: "2026-09-13T00:00:00Z", capabilities: getPublicCapabilities() }, { headers: { "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
}
