import { describe, expect, it } from "vitest";
import { USAGE_METRICS } from "./meter";
describe("usage metering contract",()=>{
 it("keeps billable metrics explicit",()=>{expect(USAGE_METRICS).toContain("api_requests");expect(USAGE_METRICS).toContain("assessment_executions");expect(USAGE_METRICS.length).toBe(5);});
});
