import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAdminAuthConfigured, isValidAdminSession } from "@/lib/admin-auth";

const ADMIN_PATH_PREFIX = "/admin";
const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_LOGIN_API_PATH = "/api/admin/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith(ADMIN_PATH_PREFIX);
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (!isAdminAuthConfigured()) {
    return new NextResponse("Admin auth is not configured.", { status: 500 });
  }

  if (pathname === ADMIN_LOGIN_PATH || pathname === ADMIN_LOGIN_API_PATH) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (isValidAdminSession(session)) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
