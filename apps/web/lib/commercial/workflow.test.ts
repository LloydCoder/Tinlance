import { describe, expect, it } from "vitest";
import { OpportunityStage } from "@prisma/client";
import { assertTransition, canTransition } from "./workflow";

describe("opportunity workflow", () => {
  it("allows the canonical happy path transitions", () => {
    expect(canTransition(OpportunityStage.NEW, OpportunityStage.ASSESSMENT_REQUESTED)).toBe(true);
    expect(canTransition(OpportunityStage.QUALIFIED, OpportunityStage.BOOKING_PENDING)).toBe(true);
    expect(canTransition(OpportunityStage.BOOKED, OpportunityStage.ASSESSMENT_COMPLETE)).toBe(true);
    expect(canTransition(OpportunityStage.PROPOSAL_SENT, OpportunityStage.ACCEPTED)).toBe(true);
    expect(canTransition(OpportunityStage.ACCEPTED, OpportunityStage.ENGAGEMENT_PENDING)).toBe(true);
    expect(canTransition(OpportunityStage.ACTIVE, OpportunityStage.COMPLETED)).toBe(true);
  });

  it("rejects skipping commercial controls", () => {
    expect(canTransition(OpportunityStage.NEW, OpportunityStage.ACCEPTED)).toBe(false);
    expect(() => assertTransition(OpportunityStage.NEW, OpportunityStage.ACCEPTED)).toThrow(/Invalid opportunity transition/);
  });
});
