import { describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "./site";

describe("canonical site origin", () => {
  it("uses the www production origin for tests and Vercel deployments", () => {
    expect(getSiteUrl()).toBe("https://www.tinlance.com");
    expect(absoluteUrl("/security")).toBe("https://www.tinlance.com/security");
  });
  it("never accepts the apex origin as canonical", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://tinlance.com";
    expect(getSiteUrl()).toBe("https://www.tinlance.com");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = previous;
  });
});
