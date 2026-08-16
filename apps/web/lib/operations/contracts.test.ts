import { describe, expect, it } from "vitest";
import { assessmentBookingSchema, leadSchema } from "./contracts";

const validBooking = {
  organizationName: "Acme Systems",
  contactName: "Jane Doe",
  email: "jane@example.com",
  startsAt: "2026-09-01T10:00:00+01:00",
  timezone: "Africa/Lagos",
};

describe("operations contracts", () => {
  it("accepts a valid assessment booking", () => {
    expect(assessmentBookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("rejects malformed booking email", () => {
    expect(assessmentBookingSchema.safeParse({ ...validBooking, email: "bad" }).success).toBe(false);
  });

  it("defaults new leads to the new lifecycle state", () => {
    const result = leadSchema.parse({
      organizationName: "Acme Systems",
      contactName: "Jane Doe",
      email: "jane@example.com",
      country: "Nigeria",
      service: "AI Engineering",
    });
    expect(result.status).toBe("new");
  });
});
