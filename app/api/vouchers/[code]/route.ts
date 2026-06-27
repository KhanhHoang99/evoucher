import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { code } = await params;

    const voucher = await prisma.voucher.findUnique({ where: { voucherCode: code } });
    if (!voucher) {
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { voucherId: voucher.id } }),
      prisma.voucher.delete({ where: { id: voucher.id } }),
    ]);

    return NextResponse.json({ message: "Đã xóa thẻ thành công" });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}