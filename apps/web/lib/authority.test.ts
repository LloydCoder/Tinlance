import { describe, expect, it } from "vitest";
import { caseStudies, researchItems, validateAuthorityContent } from "./authority";
import { insights, services } from "./content";

describe("authority content contract", () => {
  it("has no structural authority-content errors", () => {
    expect(validateAuthorityContent()).toEqual([]);
  });

  it("has unique canonical paths", () => {
    const paths = researchItems.map((item) => item.canonicalPath).concat(caseStudies.map((item) => item.canonicalPath));
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("keeps article provenance and freshness fields explicit", () => {
    for (const insight of insights) {
      expect(insight.title).toBeTruthy();
      expect(insight.authorId).toBeTruthy();
      expect(insight.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(insight.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(insight.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps service slugs unique", () => {
    expect(new Set(services.map((service) => service.slug)).size).toBe(services.length);
  });

  it("does not publish a fabricated customer case study", () => {
    expect(caseStudies).toEqual([]);
  });
});
