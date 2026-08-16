import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
