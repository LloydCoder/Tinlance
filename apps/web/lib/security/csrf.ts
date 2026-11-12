import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_PURPOSE = "tinlance:contact-lead";
const TOKEN_TTL_SECONDS = 60 * 60;
const FUTURE_SKEW_SECONDS = 60;

function getCsrfSecret(): string {
  const secret =
    process.env.CSRF_SECRET ?? process.env.BETTER_AUTH_SECRET;

  if (secret && secret.length >= 32) return secret;

  if (process.env.NODE_ENV !== "production") {
    return "tinlance-local-csrf-secret-for-development-only";
  }

  throw new Error("A CSRF signing secret of at least 32 characters is required");
}

function signTimestamp(timestamp: string): string {
  return createHmac("sha256", getCsrfSecret())
    .update(`${TOKEN_PURPOSE}:${timestamp}`)
    .digest("base64url");
}

export function createCsrfToken(now = Date.now()): string {
  const timestamp = String(Math.floor(now / 1000));
  return `${timestamp}.${signTimestamp(timestamp)}`;
}

export function verifyCsrfToken(
  token: unknown,
  now = Date.now(),
): boolean {
  if (typeof token !== "string" || token.length > 256) return false;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;

  const timestamp = Number(parts[0]);
  if (!Number.isSafeInteger(timestamp)) return false;

  const currentTime = Math.floor(now / 1000);
  if (
    timestamp > currentTime + FUTURE_SKEW_SECONDS ||
    currentTime - timestamp > TOKEN_TTL_SECONDS
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(signTimestamp(parts[0]), "base64url");
    const supplied = Buffer.from(parts[1], "base64url);

    if (expected.length !== supplied.length) return false;
    return timingSafeEqual(expected, supplied);
  } catch {
    return false;
  }
}
