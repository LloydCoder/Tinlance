import { describe, expect, it } from "vitest";
import { assertCapability, buildContext, detectCycle, DeterministicModelAdapter, mergeBudget, runControlledLoop, sanitizeMemoryContent, transitionExecution, validateToolArgs, type AgentCapability } from "@/lib/agent-runtime";
import { MCP_TOOLS } from "@/lib/mcp/registry";

const readProjects: AgentCapability = { toolId: "projects.list", action: "tinlance.projects.list", environment: "production" };
const context = { organizationId: "org-a", agentId: "agent-a", agentVersionId: "v1", executionId: "exec-a", requestId: "req-a", traceId: "trace-a", principalId: "user-a", environment: "production" } as const;

describe("M9 agent runtime invariants", () => {
  it("fails closed on invalid lifecycle transitions", () => { expect(transitionExecution("COMPLETED", "RUNNING")).toBe(false); expect(transitionExecution("RUNNING", "WAITING_FOR_APPROVAL")).toBe(true); });
  it("bounds every execution budget", () => { expect(mergeBudget({ maxTurns: 3 }).maxTurns).toBe(3); expect(() => mergeBudget({ maxTurns: -1 })).toThrow("invalid_budget_maxTurns"); });
  it("requires exact capability matches", () => { expect(assertCapability([readProjects], readProjects).toolId).toBe("projects.list"); expect(() => assertCapability([], readProjects)).toThrow("capability_not_granted"); });
  it("validates tool arguments using the M6 schema", () => { const tool = MCP_TOOLS.find((item) => item.toolId === "projects.get")!; expect(validateToolArgs(tool, { projectId: "p1" })).toEqual({ projectId: "p1" }); expect(() => validateToolArgs(tool, { projectId: 123 })).toThrow("invalid_tool_arguments"); });
  it("detects repeated identical tool calls", () => { expect(detectCycle(["x", "x"], "x")).toBe(true); expect(detectCycle(["x"], "x")).toBe(false); });
  it("rejects credential-shaped memory", () => { expect(() => sanitizeMemoryContent("api_key: definitely-not-a-real-secret-value")).toThrow("secret_memory_forbidden"); expect(sanitizeMemoryContent("ordinary customer preference")).toBe("ordinary customer preference"); });
  it("preserves provenance boundaries in model context", () => { const messages = buildContext({ system: "runtime", instructions: "agent", user: "task", memory: [{ role: "memory", content: "untrusted", source: "external" }], policy: "M7", state: "RUNNING" }); expect(messages.map((item) => item.role)).toEqual(["system", "agent", "user", "memory", "policy", "policy"]); expect(messages[3].source).toBe("external"); });
  it("runs a deterministic final-response execution", async () => { const model = new DeterministicModelAdapter([{ type: "final", content: "safe result" }]); const result = await runControlledLoop({ context, instructions: "return concise results", task: "summarize", model, tools: { execute: async () => ({}) }, capabilities: [], memory: [], provider: "test", modelName: "deterministic" }); expect(result.status).toBe("COMPLETED"); expect(result.output).toBe("safe result"); });
  it("blocks an unknown model-generated tool", async () => { const model = new DeterministicModelAdapter([{ type: "tool_call", tool: "deleteEverything", arguments: {} }]); await expect(runControlledLoop({ context, instructions: "use only granted tools", task: "do work", model, tools: { execute: async () => ({}) }, capabilities: [], memory: [], provider: "test", modelName: "deterministic" })).rejects.toThrow("tool_not_found"); });
});
