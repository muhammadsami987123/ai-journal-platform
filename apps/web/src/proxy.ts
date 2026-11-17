import { NextResponse, type NextRequest } from "next/server";

/**
 * Layer 1 of route protection (T2.8): a cheap cookie gate in the proxy. The
 * API's AuthGuard is layer 2 and remains the authority — this only avoids
 * rendering a private shell for a request that has no cookie at all.
 */

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/journal",
  "/calendar",
  "/voice-journal",
  "/insights",
  "/settings",
  "/profile"
];

const AUTH_PATHS = ["/login", "/register"];

function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token")
  );
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const session = hasSessionCookie(request);

  if (isPrivate && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (!isPrivate && AUTH_PATHS.includes(pathname) && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|images|assets|.*\\..*).*)"]
};
