import { describe, expect, it } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import nextConfig from "../next.config";
import { metadata as homeMetadata } from "../app/page";
import { metadata as resourcesMetadata } from "../app/resources/page";
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
import { caseStudies } from "./authority";
import { generateMetadata as generateServiceMetadata } from "../app/services/[slug]/page";
import { GET as getApiMetadata } from "../app/api/v1/route";
import { GET as getOpenApi } from "../app/docs/api/openapi/route";

const canonicalOrigin = "https://www.tinlance.com";

describe("technical SEO and crawler access contract", () => {
  it("allows public discovery while excluding protected namespaces", () => {
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

  it("publishes intended authority routes once on the canonical host", () => {
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

    expect(urls.includes(`${canonicalOrigin}/case-studies`)).toBe(
      caseStudies.length > 0,
    );

    for (const path of [
      "/sign-in",
      "/sign-up",
      "/admin",
      "/portal",
      "/api/",
      "/v1/",
      "/careers",
      "/changelog",
      "/press",
      "/roadmap",
      "/resources",
    ]) {
      expect(urls.some((url) => url.includes(path))).toBe(false);
    }

    expect(urls.some((url) => url.includes("?"))).toBe(false);
  });

  it("normalizes request paths and omits canonicals from tokenized URLs", () => {
    expect(
      canonicalPathFromPathname(
        "/services/ai-security?utm_source=campaign",
      ),
    ).toBe("/services/ai-security");
    expect(canonicalPathFromPathname("/sign-in?callbackURL=%2Fportal")).toBe(
      "/sign-in",
    );
    expect(canonicalPathFromPathname(null)).toBe("/");
    expect(canonicalPathFromPathname("/proposal/opaque-token")).toBeNull();
    expect(
      canonicalPathFromPathname("/client-onboarding/opaque-token"),
    ).toBeNull();
    expect(canonicalPathFromPathname("/pay/opaque-token")).toBeNull();
    expect(canonicalPathFromPathname("//external.example/path")).toBe("/");
  });

  it("keeps non-substantive placeholder pages out of search", () => {
    for (const metadata of [
      careersMetadata,
      changelogMetadata,
      pressMetadata,
      roadmapMetadata,
      resourcesMetadata,
    ]) {
      expect(metadata.robots).toMatchObject({ index: false });
    }
  });

  it("assigns self-referencing canonical URLs to public landing pages", () => {
    expect(homeMetadata.alternates?.canonical).toBe("/");
    expect(resourcesMetadata.alternates?.canonical).toBe("/resources");
    expect(contactMetadata.alternates?.canonical).toBe("/contact");
    expect(industriesMetadata.alternates?.canonical).toBe("/industries");
    expect(apiDocsMetadata.alternates?.canonical).toBe("/docs/api");
  });

  it("keeps authentication and customer-token pages out of search", () => {
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

  it("uses the canonical www host in service metadata", async () => {
    const metadata = await generateServiceMetadata({
      params: Promise.resolve({ slug: "ai-security" }),
    });

    expect(metadata.alternates?.canonical).toBe("/services/ai-security");
    expect(metadata.openGraph?.url).toBe(
      `${canonicalOrigin}/services/ai-security`,
    );
  });

  it("marks API and OpenAPI responses as non-indexable", async () => {
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
        expect.objectContaining({
          source: "/api/:path*",
          headers: noIndexHeader,
        }),
        expect.objectContaining({ source: "/v1", headers: noIndexHeader }),
        expect.objectContaining({
          source: "/v1/:path*",
          headers: noIndexHeader,
        }),
      ]),
    );

    const apiResponse = await getApiMetadata(
      new Request(`${canonicalOrigin}/v1`),
    );
    expect(apiResponse.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow",
    );

    const apiBody = (await apiResponse.json()) as { openapi: string };
    expect(apiBody.openapi).toBe("/docs/api/openapi");

    const openApiResponse = getOpenApi();
    expect(openApiResponse.headers.get("x-robots-tag")).toBe(
      "noindex, nofollow",
    );
  });

  it("permanently redirects orphaned legacy service pages", async () => {
    const redirects = await nextConfig.redirects?.();
    const redirectBySource = new Map(
      redirects?.map((rule) => [rule.source, rule]),
    );

    const expected = [
      ["/services/ai-infrastructure", "/services/ai-engineering"],
      ["/services/automation", "/services/enterprise-automation"],
      ["/services/autonomous-ai", "/agent-as-a-service"],
      ["/services/fde", "/services/forward-deployed-engineering"],
    ];

    for (const [source, destination] of expected) {
      expect(redirectBySource.get(source)).toMatchObject({
        destination,
        permanent: true,
      });
    }
  });
});
