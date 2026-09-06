import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin/", "/portal/"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/admin/", "/portal/"] },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: ["/admin/", "/portal/"] },
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin/", "/portal/"] },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/admin/", "/portal/"],
      },
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/portal/"] },
    ],
    sitemap: "https://tinlance.com/sitemap.xml",
    host: "https://tinlance.com",
  };
}
