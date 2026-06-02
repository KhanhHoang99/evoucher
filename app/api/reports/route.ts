import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN" && role !== "VIEWER") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const partnerId = searchParams.get("partnerId") ?? "";
    const storeId = searchParams.get("storeId") ?? "";
    const dateFrom = searchParams.get("dateFrom") ?? "";
    const dateTo = searchParams.get("dateTo") ?? "";
    const reportType = searchParams.get("reportType") ?? "partner";

    // Báo cáo theo partner
    if (reportType === "partner") {
      if (!partnerId) {
        return NextResponse.json({ error: "Vui lòng chọn partner" }, { status: 400 });
      }

      const vouchers = await prisma.voucher.findMany({
        where: { partnerId },
        include: {
          transactions: {
            where: {
              type: "PAYMENT",
              ...(dateFrom || dateTo ? {
                createdAt: {
                  ...(dateFrom && { gte: new Date(dateFrom) }),
                  ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
                }
              } : {}),
            },
            select: { amount: true },
          },
        },
        orderBy: { voucherCode: "asc" },
      });

      const data = vouchers.map(v => ({
        voucherCode: v.voucherCode,
        holderName: v.holderName,
        holderPhone: v.holderPhone || '—',
        initialAmount: v.initialAmount,
        balance: v.balance,
        status: v.status,
        expiresAt: new Date(v.expiresAt).toLocaleDateString('vi-VN'),
        txCount: v.transactions.length,
        totalSpent: v.transactions.reduce((sum, t) => sum + t.amount, 0),
      }))

      return NextResponse.json({ data })
    }

    // Báo cáo theo cửa hàng
    if (reportType === "store") {
      const dateFilter = (dateFrom || dateTo) ? {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
        }
      } : {}

      // Lấy tất cả cửa hàng hoặc 1 cửa hàng cụ thể
      const stores = await prisma.store.findMany({
        where: {
          isActive: true,
          ...(storeId && { id: storeId }),
        },
        include: {
          transactions: {
            where: {
              type: "PAYMENT",
              ...dateFilter,
            },
            include: {
              voucher: {
                select: {
                  voucherCode: true,
                  holderName: true,
                  partner: { select: { name: true } },
                }
              }
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { storeCode: "asc" },
      })

      // Tổng hợp theo từng cửa hàng
      const data = stores.map(store => ({
        storeCode: store.storeCode,
        storeName: store.name,
        txCount: store.transactions.length,
        totalRevenue: store.transactions.reduce((sum, t) => sum + t.amount, 0),
        transactions: store.transactions.map(t => ({
          orderCode: t.orderCode,
          voucherCode: t.voucher.voucherCode,
          holderName: t.voucher.holderName,
          partner: t.voucher.partner.name,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          createdAt: new Date(t.createdAt).toLocaleString('vi-VN'),
        }))
      }))

      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: "Loại báo cáo không hợp lệ" }, { status: 400 })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}