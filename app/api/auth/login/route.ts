import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { store: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại hoặc đã bị khóa" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mật khẩu không đúng" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
      storeName: user.store?.name ?? null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("8h")
      .sign(SECRET);

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeId: user.storeId,
        storeName: user.store?.name ?? null,
      },
    });
  } catch (error) {
    console.error("CHI TIẾT LỖI LOGIN:", error); // dòng này để xem lỗi ở Terminal
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}