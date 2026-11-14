import { describe, expect, it } from "vitest";
import { isBookableSlot, nextLocalHalfHour } from "@/lib/commercial/booking";

describe("commercial booking slot policy", () => {
  const now = new Date("2026-11-14T00:00:00.000Z");
  it("evaluates the booking window in the supplied IANA timezone, not UTC", () => {
    // 2026-11-16 09:00 in Lagos is 08:00 UTC.
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Africa/Lagos", now)).toBe(true);
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "America/New_York", now)).toBe(false);
  });

  it("rejects weekends and times outside the local 09:00-17:00 window", () => {
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Africa/Lagos", now)).toBe(true);
    expect(isBookableSlot(new Date("2026-11-15T08:00:00.000Z"), "Africa/Lagos", now)).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T16:00:00.000Z"), "Africa/Lagos", now)).toBe(false);
  });

  it("accepts only half-hour boundaries and valid IANA timezones", () => {
    expect(isBookableSlot(new Date("2026-11-16T08:15:00.000Z"), "Africa/Lagos", now)).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T08:00:30.000Z"), "Africa/Lagos", now)).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.500Z"), "Africa/Lagos", now)).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Not/A_Timezone", now)).toBe(false);
  });

  it("aligns availability to half-hour boundaries in quarter-hour-offset timezones", () => {
    // 08:44 in Kathmandu is 02:59 UTC; the next local half-hour is 09:00 / 03:15 UTC.
    expect(nextLocalHalfHour(new Date("2026-11-16T02:59:00.000Z"), "Asia/Kathmandu").toISOString()).toBe("2026-11-16T03:15:00.000Z");
  });

  it("enforces the same one-hour minimum notice as the availability endpoint", () => {
    expect(isBookableSlot(new Date("2026-11-16T08:00:00.000Z"), "Africa/Lagos", new Date("2026-11-16T07:00:00.000Z"))).toBe(false);
    expect(isBookableSlot(new Date("2026-11-16T08:30:00.000Z"), "Africa/Lagos", new Date("2026-11-16T07:00:00.000Z"))).toBe(true);
  });

});