import { describe, expect, it } from "vitest";
import { legacyUrlMap } from "./legacy-url-map";

const requiredLegacyUrls = [
  "/",
  "/services.php",
  "/work.php",
  "/threatfade.php",
  "/about.php",
  "/blog.php",
  "/pricing.php",
  "/faq.php",
  "/client/login.php",
  "/careers.php",
  "/roadmap.php",
  "/privacy.php",
  "/terms.php",
  "/unsubscribe.php",
  "/rss.php",
  "/changelog.php",
  "/press.php",
  "/partners.php",
  "/sitemap-html.php",
  "/cookies.php",
];

describe("legacy URL migration contract", () => {
  it("covers every required legacy route", () => {
    const known = new Set(legacyUrlMap.map((record) => record.legacyUrl));
    for (const route of requiredLegacyUrls) {
      expect(known.has(route)).toBe(true);
    }
  });

  it("has no duplicate legacy records", () => {
    const routes = legacyUrlMap.map((record) => record.legacyUrl);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("uses only controlled same-origin destinations", () => {
    for (const record of legacyUrlMap) {
      if (!record.currentCanonical) continue;
      expect(record.currentCanonical.startsWith("/")).toBe(true);
      expect(record.currentCanonical).not.toContain("//");
      expect(record.currentCanonical).not.toContain("javascript:");
      expect(record.currentCanonical).not.toContain("http:");
      expect(record.currentCanonical).not.toContain("https:");
    }
  });

  it("does not dump unrelated legacy content onto the homepage", () => {
    for (const record of legacyUrlMap) {
      if (record.legacyUrl === "/") continue;
      expect(record.currentCanonical).not.toBe("/");
    }
  });

  it("records a final disposition for every discovered route", () => {
    for (const record of legacyUrlMap) {
      expect(["preserve", "transform", "consolidate", "retire", "redirect"]).toContain(record.disposition);
      expect(["A", "B", "C", "D", "E"]).toContain(record.classification);
    }
  });
});
