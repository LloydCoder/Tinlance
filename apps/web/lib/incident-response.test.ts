import { describe, expect, it } from "vitest";
import {
  INCIDENT_SEVERITIES,
  validateIncidentTransition,
} from "./incident-response";
describe("incident response", () => {
  it("supports explicit severity taxonomy", () =>
    expect(INCIDENT_SEVERITIES).toEqual(["SEV1", "SEV2", "SEV3", "SEV4"]));
  it("fails closed on illegal transitions", () => {
    expect(validateIncidentTransition("DETECTED", "TRIAGED")).toBe(true);
    expect(() => validateIncidentTransition("CLOSED", "TRIAGED")).toThrow(
      "invalid_incident_transition",
    );
    expect(() => validateIncidentTransition("DETECTED", "CLOSED")).toThrow(
      "invalid_incident_transition",
    );
  });
});
