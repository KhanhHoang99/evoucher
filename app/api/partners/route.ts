import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const partners = await prisma.partner.findMany({
      include: {
        _count: { select: { vouchers: true } }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(partners.map(p => ({
      id: p.id,
      name: p.name,
      note: p.note,
      isActive: p.isActive,
      createdAt: p.createdAt,
      totalVouchers: p._count.vouchers,
    })));
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { name, note } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Thiếu tên partner" }, { status: 400 });
    }

    const existing = await prisma.partner.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });
    if (existing) {
      return NextResponse.json({ error: "Partner đã tồn tại" }, { status: 400 });
    }

    const partner = await prisma.partner.create({
      data: { name, note, isActive: true },
    });

    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}