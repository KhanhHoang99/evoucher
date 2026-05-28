import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — Cập nhật user (khóa/mở, đổi store)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.storeId !== undefined && { storeId: body.storeId }),
      },
    });

    return NextResponse.json({ id: user.id, username: user.username, isActive: user.isActive });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}