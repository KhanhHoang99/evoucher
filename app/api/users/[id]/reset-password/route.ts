import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return NextResponse.json({ message: `Đã reset mật khẩu cho ${user.username}` });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}