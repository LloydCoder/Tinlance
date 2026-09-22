const PRODUCTION_SITE_URL = "https://www.tinlance.com";

export function isVercelPreview(): boolean { return process.env.VERCEL_ENV === "preview"; }
export function isProductionSite(): boolean { return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production"; }

export function getSiteUrl(): string {
  if (process.env.VERCEL_ENV) return PRODUCTION_SITE_URL;
  if (process.env.NODE_ENV === "test") return PRODUCTION_SITE_URL;
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol !== "https:") return PRODUCTION_SITE_URL;
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "tinlance.com" || hostname === "www.tinlance.com") return PRODUCTION_SITE_URL;
      return PRODUCTION_SITE_URL;
    } catch { return PRODUCTION_SITE_URL; }
  }
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;
  return "http://localhost:3000";
}

export function absoluteUrl(path = ""): string {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${getSiteUrl()}${normalizedPath}`;
}
