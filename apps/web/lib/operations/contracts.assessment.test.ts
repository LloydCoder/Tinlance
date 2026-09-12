import { describe, expect, it } from "vitest";
import { assessmentSchema } from "./contracts";

const valid = {
  organizationName: "Acme Systems",
  contactName: "Ada Lovelace",
  email: "ada@acme.example",
  country: "Nigeria",
  roleTitle: "CTO",
  companySize: "51_200",
  website: "https://acme.example",
  capability: "AI workflow engineering",
  problem: "A production workflow is too manual and error-prone.",
  desiredOutcome: "Reduce processing time while preserving auditability.",
  urgency: "30_days",
  budgetSignal: "25k_100k",
  securitySensitivity: "sensitive",
  securityRequirements: "PII handling and auditability",
  source: "website",
  consent: true,
};

describe("assessmentSchema", () => {
  it("accepts a valid assessment and normalizes email/whitespace", () => {
    const result = assessmentSchema.parse({ ...valid, email: "  ADA@ACME.EXAMPLE " });
    expect(result.email).toBe("ada@acme.example");
    expect(result.organizationName).toBe("Acme Systems");
  });

  it("rejects missing required commercial fields", () => {
    const result = assessmentSchema.safeParse({ ...valid, problem: "", desiredOutcome: "" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email, unknown enums and missing consent", () => {
    const result = assessmentSchema.safeParse({ ...valid, email: "not-an-email", urgency: "tomorrow", consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary unknown fields", () => {
    const result = assessmentSchema.safeParse({ ...valid, qualificationScore: 100, internalRole: "admin" });
    expect(result.success).toBe(false);
  });

  it("bounds long text and URL input", () => {
    const result = assessmentSchema.safeParse({ ...valid, problem: "x".repeat(4001), website: `https://${"x".repeat(301)}.example` });
    expect(result.success).toBe(false);
  });

  it("accepts empty optional strings as absent values", () => {
    const result = assessmentSchema.parse({ ...valid, roleTitle: "", workflow: "   ", campaign: "" });
    expect(result.roleTitle).toBeUndefined();
    expect(result.workflow).toBeUndefined();
    expect(result.campaign).toBeUndefined();
  });
});
