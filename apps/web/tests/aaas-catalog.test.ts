import { describe, expect, it } from "vitest";
import offerCatalog from "../lib/platform/aaas-offers.generated.json";

describe("canonical AaaS catalog", () => {
  it("has unique offers and explicit assessment-led availability", () => {
    const ids = offerCatalog.offers.map((offer) => offer.id);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size).toBe(ids.length);
    for (const offer of offerCatalog.offers) {
      expect(offer.availability).toBe("assessment_required");
      expect(offer.commercial_posture).toBe("assessment_led");
      expect(offer.pricing).toEqual({ model: "quote_required", public_price: null, currency: null });
      expect(offer.runtime_systems).toContain("agent-platform");
      expect(offer.entitlements).toEqual({
        tenant_scoped: true,
        approval_required: true,
        usage_budget_required: true,
        region_policy_required: true,
      });
    }
  });

  it("keeps FAS-Bench evaluation-only", () => {
    for (const offer of offerCatalog.offers) {
      expect(offer.runtime_systems as string[]).not.toContain("fas-bench");
      if ((offer.evaluation_systems as string[]).includes("fas-bench")) {
        expect(offer.runtime_systems as string[]).not.toContain("fas-bench");
      }
    }
  });

  it("keeps external publishing under Agent Platform authority", () => {
    const offer = offerCatalog.offers.find((item) => item.id === "content-to-outreach-agent");
    expect(offer?.runtime_systems).toEqual(expect.arrayContaining(["hezcast", "fadereach", "agent-platform"]));
    expect(offer?.authority.external_publishing).toBe("agent-platform");
    expect(offer?.safety_boundaries.direct_external_publishing_allowed).toBe(false);
  });

  it("preserves healthcare non-diagnostic and clinician review boundaries", () => {
    const offer = offerCatalog.offers.find((item) => item.id === "governed-healthcare-workforce");
    expect(offer?.safety_boundaries).toMatchObject({
      diagnosis_or_triage: false,
      clinical_treatment_decisions: false,
      ai_scribe_requires_clinician_review: true,
    });
  });

  it("publishes no unapproved fixed prices", () => {
    expect(offerCatalog.default_pricing).toEqual({ model: "quote_required", public_price: null, currency: null });
    expect(offerCatalog.commercial_surface.public_route).toBe("/agent-as-a-service");
  });
});
