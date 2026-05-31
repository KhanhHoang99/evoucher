import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userStoreId = req.headers.get("x-user-store-id");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const voucherCode = searchParams.get("voucherCode") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const storeId = searchParams.get("storeId") ?? "";
    const type = searchParams.get("type") ?? "";
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Lọc theo ngày TRƯỚC
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = to;
      }
    }

    if (voucherCode) {
      // Tìm theo thẻ → bỏ giới hạn storeId
      whereClause.voucher = {
        voucherCode: { contains: voucherCode, mode: "insensitive" }
      };
    } else {
      // CASHIER chỉ xem cửa hàng mình
      if (role === "CASHIER" && userStoreId) {
        whereClause.storeId = userStoreId;
      }
      // ADMIN/VIEWER lọc theo storeId nếu có
      if ((role === "ADMIN" || role === "VIEWER") && storeId) {
        whereClause.storeId = storeId;
      }
    }

    // Lọc theo loại giao dịch
    if (type) {
      whereClause.type = type;
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

    const totalRevenue = await prisma.transaction.aggregate({
      where: whereClause,
      _sum: { amount: true },
    });

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
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      totalRevenue: totalRevenue._sum.amount ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}