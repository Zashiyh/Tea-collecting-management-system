import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
];

export async function middleware(
  request: NextRequest
) {
  const { pathname } = request.nextUrl;

  // Public pages/API වලට authentication අවශ්‍ය නැහැ
  if (
    PUBLIC_PATHS.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Next.js internal files
  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  // Login නැත්නම්
  if (!token) {
    // API requests
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    // Normal pages
    const loginUrl = new URL(
      "/login",
      request.url
    );

    return NextResponse.redirect(loginUrl);
  }

  // JWT secret check
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return NextResponse.json(
      {
        success: false,
        message: "Server authentication configuration error.",
      },
      { status: 500 }
    );
  }

  try {
    const secret = new TextEncoder().encode(
      JWT_SECRET
    );

    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch (error) {
    console.error(
      "Invalid authentication token:",
      error
    );

    // Invalid/expired cookie remove කරලා login එකට යවමු
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 }
      );

      response.cookies.delete("auth_token");

      return response;
    }

    const loginUrl = new URL(
      "/login",
      request.url
    );

    loginUrl.searchParams.set(
      "error",
      "session_expired"
    );

    const response =
      NextResponse.redirect(loginUrl);

    response.cookies.delete("auth_token");

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - _next/static
     * - _next/image
     * - favicon
     * - public static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};