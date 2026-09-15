import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPrefixes = ["/portal", "/admin"] as const;
const nonHtmlPrefixes = [
  "/api",
  "/_next",
  "/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
  "/icon.svg",
  "/opengraph-image.svg",
] as const;

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldSetCanonical(pathname: string) {
  return !nonHtmlPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function nextResponseWithCanonical(request: NextRequest) {
  const response = NextResponse.next();
  if (shouldSetCanonical(request.nextUrl.pathname)) {
    response.headers.set(
      "Link",
      `<https://tinlance.com${request.nextUrl.pathname}>; rel="canonical"`,
    );
  }
  return response;
}

export default function middleware(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return nextResponseWithCanonical(request);
  }

  // Better Auth uses the custom "tinlance" cookie prefix configured in
  // lib/auth.ts. getSessionCookie does not read that server configuration,
  // so the prefix must be supplied explicitly here. Without it, a valid
  // session cookie is invisible to middleware and every portal request is
  // redirected back to sign-in.
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "tinlance",
  });
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "callbackURL",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  return nextResponseWithCanonical(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
