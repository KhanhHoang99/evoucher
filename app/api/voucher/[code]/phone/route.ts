import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const role = req.headers.get("x-user-role");

    if (role !== "CASHIER" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Không có quyền thực hiện" },
        { status: 403 }
      );
    }

    const { phone } = await req.json();

    if (!phone || phone.trim() === "") {
      return NextResponse.json(
        { error: "Số điện thoại không hợp lệ" },
        { status: 400 }
      );
    }

    const voucher = await prisma.voucher.findUnique({
      where: { voucherCode: code },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Không tìm thấy thẻ" },
        { status: 404 }
      );
    }

    const updated = await prisma.voucher.update({
      where: { voucherCode: code },
      data: { holderPhone: phone.trim() },
    });

    return NextResponse.json({
      voucherCode: updated.voucherCode,
      holderName: updated.holderName,
      holderPhone: updated.holderPhone,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}