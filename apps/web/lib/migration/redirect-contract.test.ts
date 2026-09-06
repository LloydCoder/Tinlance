import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

async function getRedirects() {
  if (!nextConfig.redirects) throw new Error("redirects() is not configured");
  return nextConfig.redirects();
}

describe("Next.js legacy redirect contract", () => {
  it("uses permanent redirects for every legacy mapping", async () => {
    const redirects = await getRedirects();
    const legacy = redirects.filter((rule) => rule.source.endsWith(".php") || rule.source === "/blog");

    expect(legacy.length).toBeGreaterThanOrEqual(20);
    for (const rule of legacy) {
      expect(rule.permanent).toBe(true);
      expect(rule.destination).toMatch(/^\//);
      expect(rule.destination).not.toBe("/");
    }
  });

  it("routes the indexed ThreatFade query URL before the generic blog redirect", async () => {
    const redirects = await getRedirects();
    const threatfade = redirects.find(
      (rule) =>
        rule.source === "/blog.php" &&
        Array.isArray(rule.has) &&
        rule.has.some((condition) => condition.type === "query" && condition.key === "slug"),
    );
    const generic = redirects.find((rule) => rule.source === "/blog.php" && !rule.has);

    expect(threatfade?.destination).toBe("/research/threatfade-quic-c2-detection");
    expect(generic?.destination).toBe("/insights");
    expect(redirects.indexOf(threatfade!)).toBeLessThan(redirects.indexOf(generic!));
  });

  it("does not expose user-controlled redirect destinations", async () => {
    const redirects = await getRedirects();
    for (const rule of redirects) {
      expect(rule.destination).not.toMatch(/^(https?:|javascript:|data:)/i);
    }
  });
});
