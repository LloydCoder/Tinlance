import { describe, expect, it } from "vitest";
import { listMcpTools } from "@/lib/mcp/registry";

const names = listMcpTools().map((tool) => tool.name);

describe("MCP governed registry", () => {
  it("contains only explicitly enabled tools with bounded schemas and tenant scope", () => {
    expect(names).toEqual([...names].sort());
    for (const tool of listMcpTools()) {
      expect(tool.enabled).toBe(true);
      expect(tool.tenantScope).toBe("ORGANIZATION");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.requiredScopes.length).toBeGreaterThan(0);
      expect(tool.requiredPermissions.length).toBeGreaterThan(0);
      expect(tool.timeoutMs).toBeGreaterThan(0);
      expect(tool.timeoutMs).toBeLessThanOrEqual(10_000);
      expect(tool.allowedActorTypes).toContain("AGENT");
      expect(tool.allowedEnvironments.length).toBeGreaterThan(0);
    }
  });

  it("requires the endpoint bearer baseline plus explicit execution scopes", () => {
    const tool = listMcpTools().find((candidate) => candidate.toolId === "assessments.execute");
    expect(tool?.requiredScopes).toEqual(["mcp:read", "mcp:write", "assessments:execute"]);
  });

  it("requires approval for assessment execution", () => {
    const tool = listMcpTools().find((candidate) => candidate.toolId === "assessments.execute");
    expect(tool?.approvalRequired).toBe(true);
    expect(tool?.riskLevel).toBe("ANALYZE");
    expect(tool?.idempotent).toBe(true);
    expect(tool?.auditPolicy).toBe("ALL");
  });

  it("does not expose destructive or unrestricted integration tools", () => {
    expect(listMcpTools().some((tool) => tool.riskLevel === "DESTRUCTIVE")).toBe(false);
    expect(listMcpTools().some((tool) => tool.dataClassification === "SECRET")).toBe(false);
  });
});
