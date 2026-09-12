import { describe, expect, it } from "vitest";
import {
  EVIDENCE_STATUS_META,
  EVIDENCE_STATUSES,
  EVIDENCE_TYPES,
  evidenceStatus,
} from "../lib/evidence/taxonomy";
import { architectureModules, caseStudies, evidenceTypeLabel } from "../lib/evidence/registry";

describe("evidence taxonomy", () => {
  it("defines every public evidence status with a meaning", () => {
    expect(EVIDENCE_STATUSES).toEqual([
      "IMPLEMENTED",
      "TESTED",
      "VALIDATED",
      "EXPERIMENTAL",
      "PLANNED",
    ]);
    for (const status of EVIDENCE_STATUSES) {
      expect(EVIDENCE_STATUS_META[status].label).toBeTruthy();
      expect(EVIDENCE_STATUS_META[status].definition).toBeTruthy();
    }
  });

  it("fails unknown status values safely to PLANNED", () => {
    expect(evidenceStatus("not-a-status")).toBe("PLANNED");
  });

  it("defines labels for every evidence type", () => {
    expect(Object.keys(evidenceTypeLabel)).toHaveLength(EVIDENCE_TYPES.length);
    for (const type of EVIDENCE_TYPES) expect(evidenceTypeLabel[type]).toBeTruthy();
  });
});

describe("public architecture registry", () => {
  it("contains every required module and avoids a fake linear dependency", () => {
    expect(architectureModules.map((module) => module.id)).toEqual([
      "M1", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13", "M14",
    ]);
    expect(architectureModules.every((module) => module.purpose && module.boundary)).toBe(true);
  });
});

describe("case-study taxonomy", () => {
  it("keeps public proof distinguishable from customer case studies", () => {
    expect(caseStudies.every((study) => study.category !== "CUSTOMER_CASE_STUDY")).toBe(true);
    expect(caseStudies.find((study) => study.product === "ThreatFade")?.category).toBe("OPEN_SOURCE_VALIDATION");
    expect(caseStudies.find((study) => study.product === "FDE Mastery")?.category).toBe("ENGINEERING_CASE_STUDY");
  });
});
