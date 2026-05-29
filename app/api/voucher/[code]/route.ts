import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const role = req.headers.get("x-user-role");
    const storeId = req.headers.get("x-user-store-id");

    const voucher = await prisma.voucher.findUnique({
      where: { voucherCode: code },
      include: { partner: true },
    });

    if (!voucher) {
      return NextResponse.json(
        { error: "Không tìm thấy thẻ" },
        { status: 404 }
      );
    }

    if (voucher.status === "DISABLED") {
      return NextResponse.json(
        { error: "Thẻ đã bị vô hiệu hóa",
          expiresAt: voucher.expiresAt,
          holderName: voucher.holderName, 
        },
        
        { status: 400 }
      );
    }

    if (voucher.status === "USED") {
      return NextResponse.json(
        { error: "Thẻ đã được sử dụng hết" },
        { status: 400 }
      );
    }

    if (voucher.status === "EXPIRED" || voucher.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Thẻ đã hết hạn",
          expiresAt: voucher.expiresAt,  // ← thêm
          holderName: voucher.holderName, // ← thêm
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      voucherCode: voucher.voucherCode,
      holderName: voucher.holderName,
      holderPhone: voucher.holderPhone,
      initialAmount: voucher.initialAmount,
      balance: voucher.balance,
      status: voucher.status,
      expiresAt: voucher.expiresAt,
      partner: voucher.partner.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}