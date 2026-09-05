import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper function to decode JWT payload safely in Edge runtime
function parseJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // =========================================================================
    // 1. STRICT SUPER ADMIN PROTECTION
    // =========================================================================
    if (pathname.startsWith("/super-admin")) {
      // Whitelist the super admin login page
      if (pathname === "/super-admin/login") {
        const token = request.cookies.get("access_token")?.value;
        if (token) {
          const payload = parseJwtPayload(token);
          if (payload && payload.role === "super_admin") {
            const exp = payload.exp ? payload.exp * 1000 : 0;
            if (exp > Date.now()) {
              return NextResponse.redirect(new URL("/super-admin", request.url));
            }
          }
        }
        return NextResponse.next();
      }

      // For all other /super-admin routes, enforce super_admin role
      const token = request.cookies.get("access_token")?.value;
      if (!token) {
        return NextResponse.redirect(new URL("/super-admin/login", request.url));
      }

      const payload = parseJwtPayload(token);
      if (!payload || payload.role !== "super_admin") {
        return NextResponse.redirect(new URL("/super-admin/login", request.url));
      }

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const res = NextResponse.redirect(new URL("/super-admin/login", request.url));
        res.cookies.delete("access_token");
        return res;
      }

      return NextResponse.next();
    }

    // =========================================================================
    // 2. TENANT DASHBOARD PROTECTION
    // =========================================================================
    const isTenantProtected =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/agents") ||
      pathname.startsWith("/campaigns") ||
      pathname.startsWith("/calls") ||
      pathname.startsWith("/contacts") ||
      pathname.startsWith("/knowledge-base") ||
      pathname.startsWith("/flow") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/recordings") ||
      pathname.startsWith("/phone-numbers") ||
      pathname.startsWith("/credits") ||
      pathname.startsWith("/live-calls") ||
      pathname.startsWith("/supervisor") ||
      pathname.startsWith("/templates") ||
      pathname.startsWith("/tools");

    if (isTenantProtected) {
      const token = request.cookies.get("access_token")?.value || request.cookies.get("preview_token")?.value;
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const payload = parseJwtPayload(token);
      if (!payload) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("access_token");
        res.cookies.delete("preview_token");
        return res;
      }

      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (globalErr) {
    console.error("Middleware global error:", globalErr);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|woff|woff2)).*)",
  ],
};
