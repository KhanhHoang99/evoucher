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
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (voucherCode) {
      // Tìm theo thẻ → xem toàn hệ thống NHƯNG vẫn giữ filter ngày
      whereClause.voucher = {
        voucherCode: { contains: voucherCode, mode: "insensitive" }
      };
      // Không xóa storeId ở đây, chỉ bỏ giới hạn storeId thôi
    } else {
      // Không tìm theo thẻ → CASHIER chỉ xem cửa hàng mình
      if (role === "CASHIER" && storeId) {
        whereClause.storeId = storeId;
      }
    }

    // Lọc theo ngày
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = to;
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

    // Tính tổng doanh thu
    const totalRevenue = await prisma.transaction.aggregate({
      where: whereClause,
      _sum: { amount: true },
    });

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
      totalRevenue: totalRevenue._sum.amount ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}