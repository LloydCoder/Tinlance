import { describe, expect, it } from "vitest";
import { handleMcp } from "@/lib/mcp/server";

describe("MCP gateway transport boundary", () => {
  it("rejects non-POST transport methods", async () => {
    const response = await handleMcp(new Request("https://tinlance.test/mcp", { method: "GET" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("requires bearer authentication before dispatch", async () => {
    const response = await handleMcp(new Request("https://tinlance.test/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "MCP-Protocol-Version": "2026-07-28",
        "Mcp-Method": "tools/list",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    }));
    expect(response.status).toBe(401);
  });

  it("rejects oversized requests before authentication or tool dispatch", async () => {
    const response = await handleMcp(new Request("https://tinlance.test/mcp", {
      method: "POST",
      headers: { "content-length": String(512 * 1024 + 1) },
    }));
    expect(response.status).toBe(413);
  });
});
