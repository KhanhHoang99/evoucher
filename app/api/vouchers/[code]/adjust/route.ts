import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id");

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ admin mới có thể điều chỉnh số dư" },
        { status: 403 }
      );
    }

    const { code } = await params;
    const { adjustAmount, reason } = await req.json();

    if (!reason || reason.trim() === "") {
      return NextResponse.json(
        { error: "Vui lòng nhập lý do điều chỉnh" },
        { status: 400 }
      );
    }

    if (!adjustAmount || adjustAmount === 0) {
      return NextResponse.json(
        { error: "Số tiền điều chỉnh không hợp lệ" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.findUnique({
        where: { voucherCode: code },
      });

      if (!voucher) {
        throw new Error("Không tìm thấy thẻ");
      }

      const balanceBefore = voucher.balance;
      const balanceAfter = balanceBefore + adjustAmount;

      if (balanceAfter < 0) {
        throw new Error(`Số dư sau điều chỉnh không thể âm. Số dư hiện tại: ${balanceBefore.toLocaleString("vi-VN")}đ`);
      }

      if (balanceAfter > voucher.initialAmount) {
        throw new Error(`Số dư sau điều chỉnh không thể vượt quá giá trị ban đầu: ${voucher.initialAmount.toLocaleString("vi-VN")}đ`);
      }

      // Cập nhật số dư
      await tx.voucher.update({
        where: { voucherCode: code },
        data: {
          balance: balanceAfter,
          status: balanceAfter === 0 ? "USED" : "ACTIVE",
        },
      });

      // Ghi log transaction
      const orderCode = `ADJ${Date.now()}`;
      const transaction = await tx.transaction.create({
        data: {
          orderCode,
          amount: Math.abs(adjustAmount),
          balanceBefore,
          balanceAfter,
          type: "ADJUSTMENT",
          reason: reason.trim(),
          adjustedBy: userId,
          voucherId: voucher.id,
          storeId: null, // Điều chỉnh không thuộc cửa hàng nào
        },
      });

      return { transaction, balanceBefore, balanceAfter };
    });

    return NextResponse.json({
      message: "Điều chỉnh số dư thành công",
      orderCode: result.transaction.orderCode,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi server" },
      { status: 400 }
    );
  }
}