import type { MetadataRoute } from "next";
import { insights, services } from "../lib/content";

const staticRoutes = [
  "/",
  "/services",
  ...services.map((service) => `/services/${service.slug}`),
  "/work",
  "/assessment",
  "/insights",
  "/resources",
  "/about",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = staticRoutes.map((route) => ({
    url: `https://tinlance.com${route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/services/") ? 0.8 : 0.7,
  }));

  const insightEntries = insights.map((insight) => ({
    url: `https://tinlance.com/insights/${insight.slug}`,
    lastModified: insight.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...insightEntries];
}
