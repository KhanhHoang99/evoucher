import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const PUBLIC_PATHS = ["/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

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

export const config = {
  matcher: ["/api/:path*"],
};