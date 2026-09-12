const PRODUCTION_SITE_URL = "https://tinlance.com";

export function getSiteUrl(): string {
  if (process.env.VERCEL_ENV === "production") return PRODUCTION_SITE_URL;

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

export function absoluteUrl(path = ""): string {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `${getSiteUrl()}${normalizedPath}`;
}
