import { NextResponse } from "next/server";
import { requireWorkspacePermission } from "@/lib/workspace/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const principal = await requireWorkspacePermission("assessment:read");
  if (!principal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const base = process.env.FDE_API_URL?.replace(/\/$/, "");
  const token = process.env.FDE_SERVICE_TOKEN;
  if (!base || !token) return NextResponse.json({ error: "fde_not_configured" }, { status: 503 });
  try {
    const response = await fetch(`${base}/v1/capabilities`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") return NextResponse.json({ error: "capability_registry_unavailable" }, { status: 503 });
    return NextResponse.json(body, { headers: { "cache-control": "private, no-store" } });
  } catch { return NextResponse.json({ error: "capability_registry_unavailable" }, { status: 503 }); }
}
