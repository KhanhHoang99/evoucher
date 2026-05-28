import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — Danh sách user
export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: { store: { select: { name: true, storeCode: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      store: u.store,
    })));
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST — Tạo user mới
export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { username, password, userRole, storeId } = await req.json();

    if (!username || !password || !userRole) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (userRole === "CASHIER" && !storeId) {
      return NextResponse.json({ error: "Cashier phải có cửa hàng" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Tên đăng nhập đã tồn tại" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: userRole,
        isActive: true,
        storeId: userRole === "CASHIER" ? storeId : null,
      },
    });

    return NextResponse.json({ id: user.id, username: user.username, role: user.role });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}