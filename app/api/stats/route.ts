import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN" && role !== "VIEWER") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 29);

    // Thống kê voucher
    const [
      totalVouchers,
      activeVouchers,
      totalIssuedAmount,
      totalRemainingBalance,
    ] = await Promise.all([
      prisma.voucher.count(),
      prisma.voucher.count({ where: { status: "ACTIVE" } }),
      prisma.voucher.aggregate({ _sum: { initialAmount: true } }),
      prisma.voucher.aggregate({ _sum: { balance: true } }),
    ]);

    // Thống kê giao dịch hôm nay
    const [todayTxCount, todayRevenue] = await Promise.all([
      prisma.transaction.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { amount: true },
      }),
    ]);

    // Thống kê giao dịch tháng này
    const [monthTxCount, monthRevenue] = await Promise.all([
      prisma.transaction.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ]);

    // Thống kê theo cửa hàng (tháng này)
    const storeStats = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: { createdAt: { gte: monthStart } },
          select: { amount: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Thống kê theo partner
    const partnerStats = await prisma.partner.findMany({
      where: { isActive: true },
      include: {
        vouchers: {
          select: {
            initialAmount: true,
            balance: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Doanh thu 30 ngày gần nhất
    const dailyRevenue = await prisma.transaction.groupBy({
      by: ["createdAt"],
      where: { createdAt: { gte: last30Days } },
      _sum: { amount: true },
      orderBy: { createdAt: "asc" },
    });

    // Gom nhóm theo ngày
    const revenueByDay: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(last30Days);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      revenueByDay[key] = 0;
    }
    dailyRevenue.forEach((tx) => {
      const key = new Date(tx.createdAt).toISOString().split("T")[0];
      if (revenueByDay[key] !== undefined) {
        revenueByDay[key] += tx._sum.amount ?? 0;
      }
    });

    return NextResponse.json({
      vouchers: {
        total: totalVouchers,
        active: activeVouchers,
        totalIssuedAmount: totalIssuedAmount._sum.initialAmount ?? 0,
        totalRemainingBalance: totalRemainingBalance._sum.balance ?? 0,
      },
      today: {
        txCount: todayTxCount,
        revenue: todayRevenue._sum.amount ?? 0,
      },
      month: {
        txCount: monthTxCount,
        revenue: monthRevenue._sum.amount ?? 0,
      },
      storeStats: storeStats.map(s => ({
        name: s.name,
        storeCode: s.storeCode,
        txCount: s.transactions.length,
        revenue: s.transactions.reduce((sum, t) => sum + t.amount, 0),
      })),
      partnerStats: partnerStats.map(p => ({
        name: p.name,
        totalVouchers: p.vouchers.length,
        activeVouchers: p.vouchers.filter(v => v.status === "ACTIVE").length,
        totalIssued: p.vouchers.reduce((sum, v) => sum + v.initialAmount, 0),
        totalRemaining: p.vouchers.reduce((sum, v) => sum + v.balance, 0),
        totalSpent: p.vouchers.reduce((sum, v) => sum + (v.initialAmount - v.balance), 0),
      })),
      dailyRevenue: Object.entries(revenueByDay).map(([date, amount]) => ({
        date,
        amount,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}