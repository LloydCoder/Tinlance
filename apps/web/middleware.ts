import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const CANONICAL_HOST = "tinlance.com";
const LEGACY_HOST = "www.tinlance.com";
const protectedPrefixes = ["/portal", "/admin"] as const;
const nonHtmlPrefixes = ["/api", "/_next", "/feed.xml", "/sitemap.xml", "/robots.txt", "/icon.svg", "/opengraph-image.svg"] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function shouldSetCanonical(pathname: string) {
  return !nonHtmlPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectLegacyHost(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();
  if (hostname !== LEGACY_HOST) return null;
  const url = request.nextUrl.clone();
  url.hostname = CANONICAL_HOST;
  url.protocol = "https:";
  return NextResponse.redirect(url, 308);
}

function nextResponseWithCanonical(request: NextRequest) {
  const response = NextResponse.next();
  if (shouldSetCanonical(request.nextUrl.pathname)) {
    response.headers.set("Link", `<https://${CANONICAL_HOST}${request.nextUrl.pathname}>; rel="canonical"`);
  }
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
