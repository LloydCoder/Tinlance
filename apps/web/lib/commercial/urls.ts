export function canonicalAppUrl(path: string, configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL) {
  if (!configuredAppUrl) throw new Error("canonical_app_url_not_configured");
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("invalid_canonical_path");

  const base = new URL(configuredAppUrl);
  const localDevelopmentHost = base.hostname === "localhost" || base.hostname === "127.0.0.1";
  if (base.protocol !== "https:" && !(localDevelopmentHost && process.env.NODE_ENV !== "production")) {
    throw new Error("canonical_app_url_must_use_https");
  }
  if (base.username || base.password) throw new Error("canonical_app_url_credentials_forbidden");

  const target = new URL(path, `${base.origin}/`);
  if (target.origin !== base.origin) throw new Error("canonical_app_url_origin_mismatch");
  return target.toString();
}

export function isTrustedPaystackCheckoutUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.paystack.com" && !url.username && !url.password;
  } catch {
    return false;
  }
}
