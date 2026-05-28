import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(stores);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { storeCode, name, location } = await req.json();

    if (!storeCode || !name) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    const existing = await prisma.store.findUnique({ where: { storeCode } });
    if (existing) {
      return NextResponse.json({ error: "Mã cửa hàng đã tồn tại" }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: { storeCode, name, location, isActive: true },
    });

    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}