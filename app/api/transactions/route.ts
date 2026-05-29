import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const storeId = req.headers.get("x-user-store-id");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const voucherCode = searchParams.get("voucherCode") ?? "";
    const skip = (page - 1) * limit;

    
    // ADMIN và VIEWER xem tất cả
    let whereClause: any = {};

    if (voucherCode) {
      // Khi lọc theo thẻ cụ thể → cho phép xem toàn bộ lịch sử
      // kể cả CASHIER, để thấy khách đã mua ở cửa hàng nào khác
      whereClause.voucher = {
        voucherCode: { equals: voucherCode, mode: "insensitive" }
      };
    } else {
      // Không lọc theo thẻ → CASHIER chỉ xem cửa hàng mình
      if (role === "CASHIER" && storeId) {
        whereClause.storeId = storeId;
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          voucher: {
            select: {
              voucherCode: true,
              holderName: true,
              initialAmount: true,
              partner: { select: { name: true } },
            },
          },
          store: {
            select: { name: true, storeCode: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    // Tính thống kê nếu lọc theo voucherCode
    let stats = null;
    if (voucherCode) {
      const allTx = await prisma.transaction.findMany({
        where: whereClause,
        select: { amount: true },
      });
      stats = {
        totalCount: allTx.length,
        totalSpent: allTx.reduce((sum, tx) => sum + tx.amount, 0),
      };
    }

    return NextResponse.json({
      data: transactions,
      stats,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}