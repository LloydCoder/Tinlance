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
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `https://tinlance.com${route}`,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/services/") ? 0.8 : 0.7,
  }));

  const insightEntries: MetadataRoute.Sitemap = insights.map((insight) => ({
    url: `https://tinlance.com/insights/${insight.slug}`,
    lastModified: insight.publishedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...insightEntries];
}
