import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATH_PREFIX = "/admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next();
  }

  const adminUser = process.env.ADMIN_BASIC_USER;
  const adminPass = process.env.ADMIN_BASIC_PASS;

  if (!adminUser || !adminPass) {
    return new NextResponse("Basic auth is not configured.", { status: 500 });
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authorization.split(" ")[1] ?? "";
  const decoded = safeDecodeBase64(encoded);

  if (!decoded) {
    return unauthorized();
  }

  const [user, ...passwordParts] = decoded.split(":");
  const pass = passwordParts.join(":");

  if (user !== adminUser || pass !== adminPass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};

function unauthorized() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PTA Admin", charset="UTF-8"'
    }
  });
}

function safeDecodeBase64(value: string) {
  try {
    return atob(value);
  } catch {
    return null;
  }
}
