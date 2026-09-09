import { describe, expect, it } from "vitest";
import { compareBaseline, evaluateGate, gradeCase, selectProfile, validateRedTeamScope } from "@/lib/evaluation";

describe("M8 evaluation engine", () => {
  const badCase = { id: "bad", category: "AUTHORIZATION", subcategory: "tool", severity: "CRITICAL" as const, expectedBehavior: { decision: "DENY" }, input: { action: "delete" }, grader: "deterministic.m7_decision" };
  const goodExecution = { m7Decision: "DENY", toolCalled: false };

  it("catches a known-bad authorization fixture", () => {
    const result = gradeCase(badCase, { m7Decision: "ALLOW", toolCalled: true });
    expect(result.status).toBe("FAIL");
    expect(result.classification).toBe("SECURITY_FAILURE");
  });

  it("accepts a known-good authorization fixture", () => {
    const result = gradeCase(badCase, goodExecution);
    expect(result.status).toBe("PASS");
  });

  it("blocks critical failures regardless of aggregate pass rate", () => {
    const gate = evaluateGate({ results: [gradeCase(badCase, { m7Decision: "ALLOW", toolCalled: true }), gradeCase({ ...badCase, id: "good", severity: "LOW", expectedBehavior: { decision: "DENY" } }, goodExecution)], regressions: 0 });
    expect(gate.status).toBe("FAIL");
    expect(gate.deploymentAllowed).toBe(false);
  });

  it("detects security regressions against an immutable baseline snapshot", () => {
    const comparison = compareBaseline({ baseline: { cases: { a: "PASS", b: "FAIL" } }, current: { cases: { a: "FAIL", b: "PASS" } } });
    expect(comparison.regressions).toEqual(["a"]);
    expect(comparison.resolved).toEqual(["b"]);
  });

  it("selects full security evaluation for security-boundary changes", () => {
    expect(selectProfile(["apps/web/lib/security-gateway/index.ts"])).toBe("PRODUCTION");
    expect(selectProfile(["apps/web/lib/agent/prompt.ts"])).toBe("PULL_REQUEST");
  });

  it("rejects uncontrolled red-team scope", () => {
    expect(() => validateRedTeamScope({ environment: "production", scope: { production: true, arbitraryInternet: false }, authorization: { explicit: false }, limits: { maxRequests: 10, maxDurationSeconds: 60 } })).toThrow();
    expect(() => validateRedTeamScope({ environment: "sandbox", scope: { production: false, arbitraryInternet: true }, authorization: { explicit: true }, limits: { maxRequests: 10, maxDurationSeconds: 60 } })).toThrow();
  });

  it("does not authorize through M8", () => {
    const result = gradeCase({ ...badCase, expectedBehavior: { decision: "DENY" } }, { m7Decision: "DENY", toolCalled: false });
    expect(result.status).toBe("PASS");
  });
});
