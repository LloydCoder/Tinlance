import { describe, expect, it } from "vitest";
import { isBookableSlot } from "@/lib/commercial/booking";

describe("commercial booking slot policy", () => {
  it("evaluates the booking window in the supplied IANA timezone, not UTC", () => {
    // 2026-11-16 09:00 in Lagos is 08:00 UTC.
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Africa/Lagos")).toBe(true);
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "America/New_York")).toBe(false);
  });

  it("rejects weekends and times outside the local 09:00-17:00 window", () => {
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Africa/Lagos")).toBe(true);
    expect(isBookableSlot(new Date("2026-11-15T08:00:00.000Z"), "Africa/Lagos")).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T16:00:00.000Z"), "Africa/Lagos")).toBe(false);
  });

  it("accepts only half-hour boundaries and valid IANA timezones", () => {
    expect(isBookableSlot(new Date("2026-11-16T08:15:00.000Z"), "Africa/Lagos")).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Not/A_Timezone")).toBe(false);
  });
});
