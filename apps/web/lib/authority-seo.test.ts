import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import nextConfig from "../next.config";
import { metadata as homeMetadata } from "../app/page";
import { metadata as resourcesMetadata } from "../app/resources/page";
import { caseStudies } from "./authority";
import { metadata as careersMetadata } from "../app/careers/page";
import { metadata as changelogMetadata } from "../app/changelog/page";
import { metadata as pressMetadata } from "../app/press/page";
import { metadata as roadmapMetadata } from "../app/roadmap/page";
import { metadata as contactMetadata } from "../app/contact/page";
import { metadata as industriesMetadata } from "../app/industries/page";
import { metadata as apiDocsMetadata } from "../app/docs/api/page";
import { metadata as signInMetadata } from "../app/sign-in/[[...sign-in]]/page";
import { metadata as signUpMetadata } from "../app/sign-up/[[...sign-up]]/page";
import { metadata as caseStudiesMetadata } from "../app/case-studies/page";
import { metadata as proposalMetadata } from "../app/proposal/[token]/layout";
import { metadata as unsubscribeMetadata } from "../app/unsubscribe/page";
import { metadata as clientOnboardingMetadata } from "../app/client-onboarding/[token]/layout";
import { canonicalPathFromPathname } from "./site";
import { generateMetadata as generateServiceMetadata } from "../app/services/[slug]/page";
import { GET as getApiMetadata } from "../app/api/v1/route";
import { GET as getOpenApi } from "../app/docs/api/openapi/route";
import { caseStudies } from "./authority";

const canonicalOrigin = "https://www.tinlance.com";

describe("technical SEO and crawler access contract", () => {
  it("allows public discovery while excluding protected and API namespaces", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    for (const userAgent of [
      "Googlebot",
      "Bingbot",
      "OAI-SearchBot",
      "GPTBot",
      "Google-Extended",
      "*",
    ]) {
      const rule = rules.find((entry) => entry.userAgent === userAgent);
      expect(rule?.allow).toBe("/");
      expect(rule?.disallow).toEqual(["/admin", "/portal"]);
    }
  });

  it("publishes every intended public authority route exactly once", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(canonicalOrigin))).toBe(true);

    for (const path of [
      "/",
      "/industries",
      "/docs/api",
      "/research",
      "/research/threatfade-quic-c2-detection",
      "/guides",
      "/documentation",
      "/insights/building-production-ai-systems",
      "/assessment",
      "/sales-engineer",
    ]) {
      expect(urls).toContain(`${canonicalOrigin}${path}`);
    }

    for (const path of ["/sign-in", "/sign-up", "/admin", "/portal", "/api/", "/v1/"]) {
      expect(urls.some((url) => url.includes(path))).toBe(false);
    }

    expect(urls.includes(`${canonicalOrigin}/case-studies`)).toBe(
      caseStudies.length > 0,
    );
    expect(urls.some((url) => url.includes("?"))).toBe(false);
  });

  it("normalizes request paths for self-referencing canonicals without query strings", () => {
    expect(canonicalPathFromPathname("/services/ai-security?utm_source=campaign")).toBe("/services/ai-security");
    expect(canonicalPathFromPathname("/sign-in?callbackURL=%2Fportal")).toBe("/sign-in");
    expect(canonicalPathFromPathname(null)).toBe("/");
    expect(canonicalPathFromPathname("/proposal/opaque-token")).toBeNull();
    expect(canonicalPathFromPathname("/client-onboarding/opaque-token")).toBeNull();
    expect(canonicalPathFromPathname("//external.example/path")).toBe("/");
  });

  it("excludes placeholder and empty pages from the public sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["/careers", "/changelog", "/press", "/roadmap", "/resources", "/case-studies"]) {
      expect(urls).not.toContain(`${canonicalOrigin}${path}`);
    }
  });

  it("assigns self-referencing canonical URLs to public landing pages", () => {
    expect(homeMetadata.alternates?.canonical).toBe("/");
    expect(resourcesMetadata.alternates?.canonical).toBe("/resources");
    expect(contactMetadata.alternates?.canonical).toBe("/contact");
    expect(industriesMetadata.alternates?.canonical).toBe("/industries");
    expect(apiDocsMetadata.alternates?.canonical).toBe("/docs/api");
  });

  it("keeps authentication, customer-token, and empty case-study pages out of search", () => {
    for (const metadata of [
      signInMetadata,
      signUpMetadata,
      proposalMetadata,
      unsubscribeMetadata,
      clientOnboardingMetadata,
    ]) {
      expect(metadata.robots).toMatchObject({ index: false });
    }
    expect(caseStudiesMetadata.robots).toMatchObject({
      index: caseStudies.length > 0,
    });
  });

  it("uses the canonical www host in service metadata and structured data", async () => {
    const metadata = await generateServiceMetadata({
      params: Promise.resolve({ slug: "ai-security" }),
    });

    expect(metadata.alternates?.canonical).toBe("/services/ai-security");
    expect(metadata.openGraph?.url).toBe(
      `${canonicalOrigin}/services/ai-security`,
    );
  });

  it("does not expose API and OpenAPI JSON responses as indexable pages", async () => {
    const headerRules = await nextConfig.headers?.();
    const noIndexHeader = expect.arrayContaining([
      expect.objectContaining({
        key: "X-Robots-Tag",
        value: "noindex, nofollow",
      }),
    ]);

    expect(headerRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: "/api", headers: noIndexHeader }),
        expect.objectContaining({ source: "/api/:path*", headers: noIndexHeader }),
        expect.objectContaining({ source: "/v1", headers: noIndexHeader }),
        expect.objectContaining({ source: "/v1/:path*", headers: noIndexHeader }),
      ]),
    );
  });

  it("redirects orphaned legacy service pages to current canonical equivalents", async () => {
    const redirects = await nextConfig.redirects?.();
    const destinations = new Map(
      redirects?.map((rule) => [rule.source, rule.destination]),
    );

    expect(
      redirects?.find((rule) => rule.source === "/services/ai-infrastructure")
        ?.permanent,
    ).toBe(true);
    expect(destinations.get("/services/ai-infrastructure")).toBe(
      "/services/ai-engineering",
    );
    expect(destinations.get("/services/automation")).toBe(
      "/services/enterprise-automation",
    );
    expect(destinations.get("/services/autonomous-ai")).toBe(
      "/agent-as-a-service",
    );
    expect(destinations.get("/services/fde")).toBe(
      "/services/forward-deployed-engineering",
    );
  });

  it("marks the machine-readable OpenAPI document as non-indexable", () => {
    const response = getOpenApi();
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("advertises the actual public OpenAPI route from API metadata", async () => {
    const openApiResponse = await getOpenApi();
    expect(openApiResponse.headers.get("x-robots-tag")).toBe("noindex, nofollow");

    const response = await getApiMetadata(new Request(`${canonicalOrigin}/v1`));
    const body = (await response.json()) as { openapi: string };

    expect(body.openapi).toBe("/docs/api/openapi");
  });
});
