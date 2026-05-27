import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const storeId = req.headers.get("x-user-store-id");

    if (role !== "CASHIER") {
      return NextResponse.json(
        { error: "Chỉ nhân viên cửa hàng mới có thể thanh toán" },
        { status: 403 }
      );
    }

    if (!storeId) {
      return NextResponse.json(
        { error: "Tài khoản chưa được gán cửa hàng" },
        { status: 403 }
      );
    }

    const { voucherCode, amount } = await req.json();

    if (!voucherCode || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Thông tin thanh toán không hợp lệ" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Khóa dòng voucher lại để tránh race condition
      const voucher = await tx.voucher.findUnique({
        where: { voucherCode },
      });

      if (!voucher) {
        throw new Error("Không tìm thấy thẻ");
      }

      if (voucher.status !== "ACTIVE") {
        throw new Error("Thẻ không còn hiệu lực");
      }

      if (voucher.expiresAt < new Date()) {
        throw new Error("Thẻ đã hết hạn");
      }

      if (voucher.balance < amount) {
        throw new Error(`Số dư không đủ. Hiện còn: ${voucher.balance.toLocaleString("vi-VN")}đ`);
      }

      const balanceBefore = voucher.balance;
      const balanceAfter = balanceBefore - amount;

      // Cập nhật số dư
      await tx.voucher.update({
        where: { voucherCode },
        data: {
          balance: balanceAfter,
          status: balanceAfter === 0 ? "USED" : "ACTIVE",
        },
      });

      // Tạo mã đơn hàng theo timestamp
      const orderCode = `ORD${Date.now()}`;

      // Ghi lịch sử giao dịch
      const transaction = await tx.transaction.create({
        data: {
          orderCode,
          amount,
          balanceBefore,
          balanceAfter,
          voucherId: voucher.id,
          storeId,
        },
      });

      return {
        orderCode: transaction.orderCode,
        voucherCode,
        amount,
        balanceBefore,
        balanceAfter,
        createdAt: transaction.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi server";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}