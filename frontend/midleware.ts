/*import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  console.log("Middleware running...");

  // ❌ No token → login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const decoded = jwtDecode<{ role: string }>(token);
    const path = request.nextUrl.pathname;

    console.log("Decoded:", decoded);

    // 🔐 ADMIN ONLY
    if (path.startsWith("/admin") && decoded.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // 👤 USER ONLY
    if (path.startsWith("/dashboard") && decoded.role !== "user") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.log("Invalid token");
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// ✅ protect only these routes
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};*/