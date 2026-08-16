import type { MetadataRoute } from "next";
import { insights } from "../lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    "/services",
    "/services/autonomous-ai",
    "/services/ai-infrastructure",
    "/services/ai-security",
    "/services/automation",
    "/services/fde",
    "/work",
    "/insights",
    ...insights.map((insight) => `/insights/${insight.slug}`),
    "/resources",
    "/about",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `https://tinlance.com${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route.startsWith("/insights/") ? 0.6 : 0.7,
  }));
}
