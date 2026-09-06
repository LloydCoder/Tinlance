import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

describe("authority SEO contract", () => {
  it("allows public discovery and protects private application areas", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const openAi = rules.find((rule) => rule.userAgent === "OAI-SearchBot");
    const google = rules.find((rule) => rule.userAgent === "Googlebot");
    const bing = rules.find((rule) => rule.userAgent === "Bingbot");
    const extended = rules.find((rule) => rule.userAgent === "Google-Extended");

    for (const rule of [openAi, google, bing, extended]) {
      expect(rule?.allow).toBe("/");
      expect(rule?.disallow).toEqual(["/admin/", "/portal/"]);
    }
  });

  it("contains unique canonical authority routes and excludes private routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const path of [
      "/research",
      "/research/threatfade-quic-c2-detection",
      "/case-studies",
      "/guides",
      "/documentation",
      "/insights/building-production-ai-systems",
      "/assessment",
    ]) {
      expect(urls).toContain(`https://tinlance.com${path}`);
    }
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
    expect(urls.some((url) => url.includes("/portal"))).toBe(false);
    expect(urls.some((url) => url.includes("?"))).toBe(false);
  });
});
