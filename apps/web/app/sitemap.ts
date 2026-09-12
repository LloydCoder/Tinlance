import type { MetadataRoute } from "next";
import { caseStudies, researchItems } from "../lib/authority";
import { insights, services } from "../lib/content";
import { absoluteUrl } from "../lib/site";

const staticRoutes = [
  "/",
  "/services",
  ...services.map((service) => `/services/${service.slug}`),
  "/work",
  "/threatfade",
  "/products",
  "/fde-mastery",
  "/engineering",
  "/security",
  "/research",
  "/case-studies",
  ...caseStudies.map((item) => item.canonicalPath),
  "/guides",
  "/documentation",
  "/assessment",
  "/insights",
  "/resources",
  "/about",
  "/contact",
  "/pricing",
  "/faq",
  "/careers",
  "/roadmap",
  "/changelog",
  "/press",
  "/partners",
  "/privacy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority:
      route === "/"
        ? 1
        : route.startsWith("/services/")
          ? 0.8
          : route.startsWith("/research") || route.startsWith("/case-studies")
            ? 0.75
            : ["/assessment", "/products", "/fde-mastery", "/engineering", "/security"].includes(route)
              ? 0.85
              : 0.7,
  }));

  const insightEntries: MetadataRoute.Sitemap = insights.map((insight) => ({
    url: absoluteUrl(`/insights/${insight.slug}`),
    lastModified: insight.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const researchEntries: MetadataRoute.Sitemap = researchItems.map((item) => ({
    url: absoluteUrl(item.canonicalPath),
    lastModified: item.updatedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticEntries, ...insightEntries, ...researchEntries];
}
