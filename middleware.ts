
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/manifest.webmanifest",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages and PWA manifest
  if (
    PUBLIC_PATHS.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Next.js internal files and public static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;

  // Reject requests without a session
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Ensure JWT_SECRET is configured
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Server authentication configuration error.",
        },
        { status: 500 }
      );
    }

    return new NextResponse("Server configuration error.", {
      status: 500,
    });
  }

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch {
    // Invalid or expired session
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

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "session_expired");

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth_token");

    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
