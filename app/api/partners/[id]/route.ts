import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.note !== undefined && { note: body.note }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(partner);
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}