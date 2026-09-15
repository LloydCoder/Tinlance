const PRODUCTION_SITE_URL = "https://www.tinlance.com";

export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === "preview";
}

export function isProductionSite(): boolean {
  return process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
}

export function getSiteUrl(): string {
  // Vercel preview deployments must never become the public canonical identity.
  if (process.env.VERCEL_ENV) return PRODUCTION_SITE_URL;

  // Metadata/SEO contract tests intentionally resolve against the public origin.
  if (process.env.NODE_ENV === "test") return PRODUCTION_SITE_URL;

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_URL;

  return "http://localhost:3000";
}

export function absoluteUrl(path = ""): string {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${getSiteUrl()}${normalizedPath}`;
}
