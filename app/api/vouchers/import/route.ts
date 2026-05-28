import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Chỉ admin mới có thể import thẻ" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<any>(sheet);

    if (rawData.length === 0) {
      return NextResponse.json({ error: "File không có dữ liệu" }, { status: 400 });
    }

    const cleanedData = rawData.map((row) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        newRow[key.trim().toLowerCase()] = row[key];
      });
      return newRow;
    });

    const result = await prisma.$transaction(async (tx) => {
      let importedCount = 0;

      for (const row of cleanedData) {
        const holderName = row["họ và tên"];
        const partnerName = row["công ty"];
        const initialAmount = row["mức voucher"] ? parseInt(String(row["mức voucher"]).replace(/[^0-9]/g, "")) : null;
        const voucherCode = row["mã thẻ in trên thẻ nhựa"] ? String(row["mã thẻ in trên thẻ nhựa"]).trim() : null;
        const rawExpiresAt = row["ngày hết hạn thẻ"];
        const rawPhone = row["số điện thoại"] || row["sđt"];
        const holderPhone = rawPhone ? String(rawPhone).trim() : null;

        if (!holderName || !partnerName || !initialAmount || !voucherCode || !rawExpiresAt) {
          throw new Error(`Dòng [${holderName || "Không rõ"}] thiếu thông tin bắt buộc`);
        }

        const existing = await tx.voucher.findUnique({ where: { voucherCode } });
        if (existing) {
          throw new Error(`Mã thẻ [${voucherCode}] đã tồn tại`);
        }

        let partner = await tx.partner.findFirst({
          where: { name: { equals: partnerName, mode: "insensitive" } },
        });
        if (!partner) {
          partner = await tx.partner.create({
            data: { name: partnerName, isActive: true },
          });
        }

        let expiresAt: Date;
        if (typeof rawExpiresAt === "number") {
          expiresAt = new Date((rawExpiresAt - 25569) * 86400 * 1000);
        } else {
          const dateStr = String(rawExpiresAt).trim();
          if (dateStr.includes("/")) {
            const [day, month, year] = dateStr.split("/");
            expiresAt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59);
          } else {
            expiresAt = new Date(dateStr);
          }
        }

        if (isNaN(expiresAt.getTime())) {
          throw new Error(`Ngày hết hạn thẻ [${voucherCode}] không hợp lệ`);
        }

        await tx.voucher.create({
          data: {
            voucherCode,
            holderName,
            holderPhone,
            initialAmount,
            balance: initialAmount,
            status: "ACTIVE",
            expiresAt,
            partnerId: partner.id,
          },
        });

        importedCount++;
      }

      return { count: importedCount };
    });

    return NextResponse.json({
      success: true,
      message: `Đã import thành công ${result.count} thẻ voucher`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}