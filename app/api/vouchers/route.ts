import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN" && role !== "VIEWER") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const search = searchParams.get("search") ?? "";
    const partnerId = searchParams.get("partnerId") ?? "";
    const status = searchParams.get("status") ?? "";
    const skip = (page - 1) * limit;

    const where: any = {}
    if (search) {
      where.OR = [
        { voucherCode: { contains: search, mode: "insensitive" } },
        { holderName: { contains: search, mode: "insensitive" } },
        { holderPhone: { contains: search, mode: "insensitive" } },
      ]
    }
    if (partnerId) where.partnerId = partnerId
    if (status) where.status = status

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: { partner: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({
      data: vouchers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}