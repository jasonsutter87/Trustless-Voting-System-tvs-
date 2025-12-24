import { auth } from "@/lib/auth";

/**
 * Middleware to protect routes that require authentication
 *
 * Protected routes:
 * - /dashboard and all sub-routes
 * - /api routes (except /api/auth/*)
 *
 * Public routes:
 * - /login
 * - /auth/* (authentication flows)
 * - / (home/landing)
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Protected routes
  const protectedPaths = ["/dashboard"];
  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route while unauthenticated
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing login while authenticated
  if (pathname.startsWith("/login") && isAuthenticated) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  return undefined;
});

/**
 * Matcher configuration for middleware
 * Runs on all routes except static files, images, and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
