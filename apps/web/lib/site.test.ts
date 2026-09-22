import { describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "./site";

describe("canonical site origin", () => {
  it("uses the apex production origin for tests and Vercel deployments", () => {
    expect(getSiteUrl()).toBe("https://tinlance.com");
    expect(absoluteUrl("/security")).toBe("https://tinlance.com/security");
  });

  it("never accepts the legacy www origin as canonical", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.tinlance.com";
    expect(getSiteUrl()).toBe("https://tinlance.com");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  });
});
