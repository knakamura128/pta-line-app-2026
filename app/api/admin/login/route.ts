import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSessionValue, getAdminCredentials, isAdminAuthConfigured } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const user = readString(formData, "user");
  const pass = readString(formData, "pass");
  const next = normalizeNext(readString(formData, "next"));

  if (!isAdminAuthConfigured()) {
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url), { status: 303 });
  }

  const credentials = getAdminCredentials();
  if (user !== credentials.user || pass !== credentials.pass) {
    return NextResponse.redirect(new URL(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`, request.url), {
      status: 303
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12
  });

  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNext(value: string) {
  if (!value.startsWith("/")) {
    return "/admin";
  }

  if (!value.startsWith("/admin")) {
    return "/admin";
  }

  return value;
}
