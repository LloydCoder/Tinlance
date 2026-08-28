import { describe, expect, it } from "vitest";
import { growthEventSchema } from "./event-contract";

describe("growth event contract", () => {
  it("accepts a canonical lead event", () => {
    const parsed = growthEventSchema.parse({
      eventName: "lead_captured",
      source: "website",
      path: "/contact",
      entityId: "lead_123",
      privacyClass: "PERSONAL",
      properties: { service: "AI Security" },
    });
    expect(parsed.eventName).toBe("lead_captured");
    expect(parsed.schemaVersion).toBe(1);
  });

  it("rejects non-canonical event names", () => {
    expect(() =>
      growthEventSchema.parse({
        eventName: "made_up_event",
        source: "website",
        privacyClass: "PUBLIC",
      }),
    ).toThrow();
  });

  it("rejects oversized paths", () => {
    expect(() =>
      growthEventSchema.parse({
        eventName: "page_view",
        source: "website",
        privacyClass: "PUBLIC",
        path: "/".repeat(2050),
      }),
    ).toThrow();
  });
});
