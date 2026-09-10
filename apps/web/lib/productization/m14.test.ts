import { describe, expect, it } from "vitest";
import { M14_POLICY_VERSION, recurrenceDecision, scoreOpportunity, transition, validateTransition } from "./m14";

describe("M14 productization policy", () => {
  it("requires independent organizations plus similarity before recurrence validation", () => {
    expect(recurrenceDecision({ occurrenceCount: 8, organizationCount: 1, sourceCount: 1, timespanDays: 180, similarityScore: 95, solutionReuseScore: 95 }).validated).toBe(false);
    expect(recurrenceDecision({ occurrenceCount: 2, organizationCount: 2, sourceCount: 2, timespanDays: 30, similarityScore: 80, solutionReuseScore: 80 }).validated).toBe(true);
  });
  it("produces an explainable weighted score with confidence", () => {
    const evidence=["ev-1"];
    const dimensions={recurrence:{value:80,confidence:1,evidenceIds:evidence},customer_pain:{value:90,confidence:1,evidenceIds:evidence},economic_value:{value:70,confidence:.8,evidenceIds:evidence},willingness_to_pay:{value:60,confidence:.7,evidenceIds:evidence},solution_repeatability:{value:85,confidence:1,evidenceIds:evidence},delivery_repeatability:{value:75,confidence:.9,evidenceIds:evidence},automation_feasibility:{value:80,confidence:.9,evidenceIds:evidence},security_feasibility:{value:85,confidence:1,evidenceIds:evidence},market_breadth:{value:65,confidence:.7,evidenceIds:evidence},evidence_quality:{value:90,confidence:1,evidenceIds:evidence}};
    const result=scoreOpportunity(dimensions);
    expect(result.policyVersion).toBe(M14_POLICY_VERSION); expect(result.total).toBeGreaterThan(0); expect(result.breakdown).toHaveLength(10); expect(result.breakdown.every(item=>item.weighted>=0)).toBe(true);
  });
  it("rejects invalid lifecycle transitions", () => { expect(validateTransition("OBSERVED","NORMALIZED")).toBe(true); expect(()=>validateTransition("OBSERVED","PRODUCTIZED")).toThrow("m14_invalid_transition"); expect(()=>validateTransition("PRODUCTIZED","OPPORTUNITY")).toThrow("m14_invalid_transition"); });
  it("prevents an AI agent from approving its own productization transition before any database access", async () => { await expect(transition({userId:"agent",organizationId:"org-a",requestId:"req-1",principalType:"AI_AGENT",opportunityId:"m14opp_test",to:"PRODUCTIZED",rationale:"malicious self approval"})).rejects.toThrow("m14_ai_cannot_approve"); });
});
