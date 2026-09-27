import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "www.tinlance.com";
const LEGACY_HOST = "tinlance.com";
const protectedPrefixes = ["/portal", "/admin"] as const;
const nonHtmlPrefixes = ["/api", "/_next", "/feed.xml", "/sitemap.xml", "/robots.txt", "/icon.svg", "/opengraph-image.svg"] as const;

function isProtectedPath(pathname: string) { return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)); }
function shouldSetCanonical(pathname: string) { return !nonHtmlPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)); }

function redirectLegacyHost(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  if (hostname !== LEGACY_HOST) return null;
  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOST;
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

function nextResponseWithCanonical(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    "connect-src 'self' https://vitals.vercel-insights.com",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", cspHeader);
  if (shouldSetCanonical(request.nextUrl.pathname)) response.headers.set("Link", `<https://${CANONICAL_HOST}${request.nextUrl.pathname}>; rel="canonical"`);
  return response;
}

export default function middleware(request: NextRequest) {
  const legacyRedirect = redirectLegacyHost(request);
  if (legacyRedirect) return legacyRedirect;
  if (!isProtectedPath(request.nextUrl.pathname)) return nextResponseWithCanonical(request);
  const sessionCookie = getSessionCookie(request, { cookiePrefix: "tinlance" });
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackURL", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }
  return nextResponseWithCanonical(request);
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
