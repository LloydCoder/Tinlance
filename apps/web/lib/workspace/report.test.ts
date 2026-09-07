import { describe, expect, it } from "vitest";
import { generateAssessmentReport } from "./report";

describe("M3 report generation", () => {
  it("is deterministic and hashes the exact published content", () => {
    const input = { title: "Security Assessment", projectName: "Project A", assessmentType: "cybersecurity", assessmentPeriod: "2026-09-06", objective: "Assess the production application.", methodology: "Evidence-backed technical review.", findings: [{ id: "f1", title: "Missing control", description: "The control is absent.", severity: "HIGH", category: "Access Control", affectedAsset: "api", recommendation: "Implement the control." }], evidence: [{ id: "e1", title: "Screenshot", contentHash: "abc", type: "screenshot" }], remediation: [{ findingId: "f1", title: "Implement control", status: "OPEN", priority: "high" }] };
    const first = generateAssessmentReport(input); const second = generateAssessmentReport(input);
    expect(first.content).toBe(second.content); expect(first.contentHash).toBe(second.contentHash); expect(first.content).toContain("Missing control"); expect(first.content).toContain("abc");
  });

  it("escapes customer-controlled report text", () => {
    const result = generateAssessmentReport({ title: "<script>", projectName: "Project", assessmentType: "custom", assessmentPeriod: "now", objective: "<img src=x>", methodology: "review", findings: [], evidence: [], remediation: [] });
    expect(result.content).not.toContain("<script>"); expect(result.content).toContain("&lt;script&gt;");
  });
});
