import { describe, expect, it } from "vitest";
import { detectSensitive, minimizeAndDeidentify, sha256 } from "@/lib/intelligence/m13";

describe("M13 privacy transformation", () => {
  it("detects secrets before transformation", () => {
    const result = detectSensitive("password=not-a-real-production-secret-value");
    expect(result.secret).toBe(true);
  });

  it("rejects secret-bearing source material", () => {
    expect(() => minimizeAndDeidentify("API_KEY=not-a-real-production-secret-value")).toThrow("m13_secret_detected");
  });

  it("removes direct identifiers and generalizes quasi-identifiers", () => {
    const result = minimizeAndDeidentify("Customer Example Corp, email person@example.test, IP 10.20.30.40, in Amsterdam used Kubernetes and AWS in August 2026.");
    expect(result.content).not.toContain("person@example.test");
    expect(result.content).not.toContain("10.20.30.40");
    expect(result.content).not.toContain("Example Corp");
    expect(result.content).not.toContain("Amsterdam");
    expect(result.content).not.toContain("August 2026");
    expect(result.content).toContain("container orchestration platform");
    expect(result.content).toContain("major cloud provider");
  });

  it("is deterministic for provenance hashes", () => {
    expect(sha256("same input")).toBe(sha256("same input"));
    expect(sha256("same input")).not.toBe(sha256("different input"));
  });

  it("keeps security incidents from being silently public", () => {
    const result = minimizeAndDeidentify("An assessed organization experienced a zero-day incident during the observed period.");
    expect(result.content).toContain("zero-day");
  });
});
