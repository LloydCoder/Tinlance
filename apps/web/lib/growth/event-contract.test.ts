import { describe, expect, it } from "vitest";
import { growthEventSchema } from "./event-contract";

describe("growth event contract", () => {
  it("accepts a bounded public page event", () => {
    const result = growthEventSchema.safeParse({ eventName: "page_view", source: "website", path: "/fde", anonymousId: "anon-1", privacyClass: "PUBLIC" });
    expect(result.success).toBe(true);
  });

  it("rejects unknown event names and oversized paths", () => {
    expect(growthEventSchema.safeParse({ eventName: "made_up", source: "website", privacyClass: "PUBLIC" }).success).toBe(false);
    expect(growthEventSchema.safeParse({ eventName: "page_view", source: "website", path: "x".repeat(2049), privacyClass: "PUBLIC" }).success).toBe(false);
  });
});
