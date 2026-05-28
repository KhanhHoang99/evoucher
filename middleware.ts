import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Cho phép public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Lấy token
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("token")?.value;
  const token = authHeader?.replace("Bearer ", "") || cookieToken;

  // Nếu là API route
  if (pathname.startsWith("/api")) {
    if (!token) {
      return NextResponse.json(
        { error: "Không có token xác thực" },
        { status: 401 }
      );
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", payload.id as string);
      requestHeaders.set("x-user-role", payload.role as string);
      requestHeaders.set("x-user-store-id", (payload.storeId as string) ?? "");
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      return NextResponse.json(
        { error: "Token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }
  }

  // Nếu là page route — kiểm tra token từ cookie
  if (!cookieToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(cookieToken, SECRET);
    const role = payload.role as string;

    // Bảo vệ /admin/* — chỉ ADMIN
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Bảo vệ /viewer/* — ADMIN + VIEWER
    if (pathname.startsWith("/viewer") && role !== "ADMIN" && role !== "VIEWER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Bảo vệ /cashier — chỉ CASHIER
    if (pathname.startsWith("/cashier") && role !== "CASHIER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/viewer/:path*", "/cashier/:path*"],
};