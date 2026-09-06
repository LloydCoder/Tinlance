import { describe, expect, it } from "vitest";
import { qualifyAssessment } from "./qualification";

const base = {
  problem: "A production workflow is failing at scale.",
  workflow: "Human review is currently manual.",
  currentArchitecture: "Next.js + PostgreSQL + model API",
  constraints: "Must remain inside existing environment.",
  desiredOutcome: "Reduce processing time and error rate.",
  urgency: "30_days",
  stakeholders: "CTO and operations lead",
  existingSystems: "Existing production application",
  securityRequirements: "PII handling and auditability",
  businessImpact: "Reduce operating cost materially.",
  budgetSignal: "25k_100k",
  companySize: "51_200",
  roleTitle: "CTO",
  technicalEnvironment: "TypeScript and PostgreSQL",
  securitySensitivity: "sensitive",
};

describe("qualifyAssessment", () => {
  it("qualifies a commercially credible production problem", () => {
    const result = qualifyAssessment(base);
    expect(result.status).toBe("QUALIFIED");
    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.why).toContain("Qualified");
    expect(result.nextAction).toBe("Schedule technical discovery");
  });

  it("explains why a thin request is not ready", () => {
    const result = qualifyAssessment({
      ...base,
      problem: "",
      desiredOutcome: "",
      businessImpact: "",
      workflow: "",
      currentArchitecture: "",
      technicalEnvironment: "",
      stakeholders: "",
      roleTitle: "",
      budgetSignal: "unknown",
    });
    expect(result.status).toBe("DISQUALIFIED");
    expect(result.missing).toContain("Problem");
    expect(result.missing).toContain("Impact");
    expect(result.nextAction).toBe("Review missing qualification evidence");
  });
});
