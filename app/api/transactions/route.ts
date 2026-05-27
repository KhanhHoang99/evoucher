import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const storeId = req.headers.get("x-user-store-id");

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const skip = (page - 1) * limit;

    // CASHIER chỉ xem được cửa hàng mình
    // ADMIN và VIEWER xem được tất cả
    const whereClause =
      role === "CASHIER" && storeId
        ? { storeId }
        : {};

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          voucher: {
            select: {
              voucherCode: true,
              holderName: true,
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

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}