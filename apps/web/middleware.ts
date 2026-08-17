import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/portal(.*)", "/admin(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  },
  () => ({
    authorizedParties: [process.env.NEXT_PUBLIC_APP_URL].filter(
      (value): value is string => Boolean(value),
    ),
  }),
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|webp|txt|xml|woff2?|ttf|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
