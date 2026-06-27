import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


//Xóa Thẻ
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


//Khóa Thẻ
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { code } = await params;
    const { action } = await req.json(); // "lock" hoặc "unlock"

    const voucher = await prisma.voucher.findUnique({ where: { voucherCode: code } });
    if (!voucher) {
      return NextResponse.json({ error: "Không tìm thấy thẻ" }, { status: 404 });
    }

    const newStatus = action === "lock" ? "DISABLED" : "ACTIVE";

    await prisma.voucher.update({
      where: { voucherCode: code },
      data: { status: newStatus },
    });

    return NextResponse.json({ message: action === "lock" ? "Đã khóa thẻ" : "Đã mở khóa thẻ" });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}