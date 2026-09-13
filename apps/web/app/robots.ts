import type { MetadataRoute } from "next";
import { absoluteUrl, isVercelPreview } from "../lib/site";

const disallowed = ["/admin/", "/portal/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  if (isVercelPreview()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: disallowed },
      { userAgent: "Bingbot", allow: "/", disallow: disallowed },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: disallowed },
      { userAgent: "GPTBot", allow: "/", disallow: disallowed },
      { userAgent: "Google-Extended", allow: "/", disallow: disallowed },
      { userAgent: "*", allow: "/", disallow: disallowed },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
