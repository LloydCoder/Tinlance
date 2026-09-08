import { describe, expect, it } from "vitest";
import { parameterHash } from "@/lib/mcp/policy";

describe("MCP policy bindings", () => {
  it("binds approvals to the exact action parameters while excluding the approval token itself", () => {
    const first = parameterHash({ projectId: "p1", assessmentId: "a1", idempotencyKey: "idem-12345678", approvalId: "appr-a" });
    const second = parameterHash({ projectId: "p1", assessmentId: "a1", idempotencyKey: "idem-12345678", approvalId: "appr-b" });
    const changed = parameterHash({ projectId: "p2", assessmentId: "a1", idempotencyKey: "idem-12345678" });
    expect(first).toBe(second);
    expect(first).not.toBe(changed);
  });

  it("is deterministic for equivalent JSON objects", () => {
    expect(parameterHash({ a: 1, b: "x" })).toBe(parameterHash({ a: 1, b: "x" }));
  });
});
