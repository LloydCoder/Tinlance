import { handleMcp } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleMcp(request);
}

export async function GET() {
  return new Response(JSON.stringify({ code: "METHOD_NOT_ALLOWED", title: "MCP uses POST Streamable HTTP requests" }), { status: 405, headers: { "content-type": "application/json", allow: "POST", "cache-control": "no-store" } });
}

export async function DELETE() {
  return new Response(JSON.stringify({ code: "METHOD_NOT_ALLOWED", title: "MCP 2026-07-28 is stateless and does not use DELETE sessions" }), { status: 405, headers: { "content-type": "application/json", allow: "POST", "cache-control": "no-store" } });
}
