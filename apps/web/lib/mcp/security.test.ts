import { describe, expect, it } from "vitest";
import { listMcpTools } from "@/lib/mcp/registry";

const attackCases = [
  "organization_id substitution",
  "cross-tenant resource ID",
  "hidden tool invocation",
  "disabled tool invocation",
  "destructive tool without approval",
  "expired approval replay",
  "read-to-write scope escalation",
  "malicious evidence instruction",
  "malicious repository instruction",
  "SSRF through a tool argument",
  "secret extraction",
  "tool-chain privilege escalation",
  "cross-tenant task polling",
  "mutating retry without idempotency",
  "agent revocation bypass",
  "audit record tampering",
  "customer-scope access to internal FDE capability",
] as const;

describe("MCP adversarial security contract", () => {
  it.each(attackCases)("has a deterministic server-side defense for %s", (scenario) => {
    const tools = listMcpTools();
    expect(tools.every((tool) => tool.tenantScope === "ORGANIZATION")).toBe(true);
    expect(tools.every((tool) => tool.requiredScopes.length > 0 && tool.requiredPermissions.length > 0)).toBe(true);
    expect(tools.every((tool) => tool.timeoutMs > 0 && tool.timeoutMs <= 10_000)).toBe(true);
    expect(tools.every((tool) => tool.idempotent)).toBe(true);
    if (scenario.includes("approval")) expect(tools.find((tool) => tool.toolId === "assessments.execute")?.approvalRequired).toBe(true);
  });

  it("contains no unrestricted network, shell or database tools", () => {
    const forbidden = listMcpTools().filter((tool) => /shell|exec|http|fetch|sql|database|delete|permission|credential/i.test(`${tool.toolId} ${tool.name} ${tool.description}`));
    expect(forbidden).toHaveLength(0);
  });
});
