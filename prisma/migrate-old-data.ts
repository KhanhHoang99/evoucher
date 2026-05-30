import { PrismaClient } from "../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const adapter = new PrismaPg({
  connectionString: "postgresql://evoucher_user:evoucher_pass@localhost:5432/evoucher_db",
});
const prisma = new PrismaClient({ adapter });

// Map store code → id
const storeMap: Record<string, string> = {};

async function main() {
  console.log("🚀 Bắt đầu migrate data...\n");

  // ==========================================
  // BƯỚC 1: Tạo Partner
  // ==========================================
  console.log("📦 Bước 1: Tạo partner Cảng Đà Nẵng...");
  const partner = await prisma.partner.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Cảng Đà Nẵng",
      isActive: true,
    },
  });
  console.log(`✅ Partner: ${partner.name}\n`);

  // ==========================================
  // BƯỚC 2: Tạo 8 Stores
  // ==========================================
  console.log("🏪 Bước 2: Tạo 8 stores...");
  const stores = [
    { storeCode: "CH06",   name: "Cửa hàng 06" },
    { storeCode: "CH49",   name: "Cửa hàng 49" },
    { storeCode: "CH57",   name: "Cửa hàng 57 Lê Duẩn" },
    { storeCode: "CH147",  name: "Cửa hàng 147" },
    { storeCode: "CH246",  name: "Cửa hàng 246" },
    { storeCode: "CH492",  name: "Cửa hàng 492" },
    { storeCode: "CH703",  name: "Cửa hàng 703" },
    { storeCode: "CH1392", name: "Cửa hàng 1392" },
  ];

  for (const s of stores) {
    const store = await prisma.store.upsert({
      where: { storeCode: s.storeCode },
      update: {},
      create: { storeCode: s.storeCode, name: s.name, isActive: true },
    });
    storeMap[s.storeCode] = store.id;
    console.log(`✅ ${store.storeCode} → ${store.name}`);
  }
  console.log();

  // ==========================================
  // BƯỚC 3: Migrate Vouchers từ CSV
  // ==========================================
  console.log("🎫 Bước 3: Migrate vouchers từ customer_info.csv...");
  const customerCsv = fs.readFileSync(
    path.join("prisma", "customer_info.csv"),
    "utf-8"
  );
  const customers = parse(customerCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  let voucherSuccess = 0;
  let voucherSkipped = 0;
  let voucherError = 0;
  const errorLogs: string[] = [];

  for (const row of customers) {
    try {
      const voucherCode = String(row.VoucherId || row.voucherid || "").trim();
      if (!voucherCode) { voucherError++; continue; }

      // Bỏ qua nếu đã tồn tại
      const existing = await prisma.voucher.findUnique({
        where: { voucherCode },
      });
      if (existing) { voucherSkipped++; continue; }

      // Parse ngày hết hạn — format MM/DD/YYYY
      const expiryStr = String(row.Expiry || row.expiry || "").trim();
      let expiresAt: Date;
      const parts = expiryStr.split("/");
      if (parts.length === 3) {
        expiresAt = new Date(
          parseInt(parts[2]),      // year
          parseInt(parts[0]) - 1, // month (MM-1)
          parseInt(parts[1]),      // day
          23, 59, 59
        );
      } else {
        expiresAt = new Date(expiryStr);
      }

      if (isNaN(expiresAt.getTime())) {
        errorLogs.push(`Ngày hết hạn không hợp lệ: ${voucherCode} - "${expiryStr}"`);
        voucherError++;
        continue;
      }

      const cash = parseInt(row.Cash || row.cash || "0") || 0;
      const balanceRaw = row.Balance || row.balance;
      const balance = (balanceRaw && balanceRaw !== "NULL" && balanceRaw !== "")
        ? parseInt(balanceRaw)
        : cash;

      const phone = row.Phone || row.phone || "";

      await prisma.voucher.create({
        data: {
          voucherCode,
          holderName: String(row.Name || row.name || "Không rõ").trim(),
          holderPhone: phone.trim() || null,
          initialAmount: cash,
          balance,
          status: "ACTIVE",
          expiresAt,
          partnerId: partner.id,
        },
      });

      voucherSuccess++;
      if (voucherSuccess % 100 === 0) {
        console.log(`   ...đã migrate ${voucherSuccess} vouchers`);
      }
    } catch (err: any) {
      errorLogs.push(`Lỗi voucher: ${err.message}`);
      voucherError++;
    }
  }
  console.log(`✅ Vouchers: ${voucherSuccess} thành công | ${voucherSkipped} bỏ qua | ${voucherError} lỗi\n`);

  // ==========================================
  // BƯỚC 4: Migrate Transactions từ CSV
  // ==========================================
  console.log("📋 Bước 4: Migrate transactions từ order_history.csv...");
  const orderCsv = fs.readFileSync(
    path.join("prisma", "order_history.csv"),
    "utf-8"
  );
  const orders = parse(orderCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  // Load initialAmount của tất cả vouchers để tính balance
  const allVouchers = await prisma.voucher.findMany({
    select: { id: true, voucherCode: true, initialAmount: true }
  });
  const voucherMap: Record<string, { id: string; initialAmount: number }> = {};
  for (const v of allVouchers) {
    voucherMap[v.voucherCode] = { id: v.id, initialAmount: v.initialAmount };
  }

  // Group orders theo VoucherId, sort theo Time
  const ordersByVoucher: Record<string, any[]> = {};
  for (const order of orders) {
    const code = String(order.VoucherId || order.voucherid || "").trim();
    if (!ordersByVoucher[code]) ordersByVoucher[code] = [];
    ordersByVoucher[code].push(order);
  }

  // Sort theo thời gian trong mỗi nhóm
  for (const code of Object.keys(ordersByVoucher)) {
    ordersByVoucher[code].sort((a, b) => {
      return parseTime(a.Time || a.time) - parseTime(b.Time || b.time);
    });
  }

  let txSuccess = 0;
  let txSkipped = 0;
  let txError = 0;

  for (const [voucherCode, txList] of Object.entries(ordersByVoucher)) {
    const voucherInfo = voucherMap[voucherCode];
    if (!voucherInfo) {
      txError += txList.length;
      errorLogs.push(`Không tìm thấy voucher: ${voucherCode}`);
      continue;
    }

    let runningBalance = voucherInfo.initialAmount;

    for (const order of txList) {
      try {
        const orderCode = String(order.OrderId || order.orderid || "").trim();
        if (!orderCode) { txError++; continue; }

        const existing = await prisma.transaction.findUnique({
          where: { orderCode }
        });
        if (existing) { txSkipped++; continue; }

        const storeCode = String(order.Store || order.store || "").trim();
        const storeId = storeMap[storeCode];
        if (!storeId) {
          errorLogs.push(`Không tìm thấy store: ${storeCode} (order: ${orderCode})`);
          txError++;
          continue;
        }

        // Parse thời gian — format DD/MM/YYYY HH:MM:SS
        const timeStr = String(order.Time || order.time || "").trim();
        const createdAt = parseDateTime(timeStr);

        if (isNaN(createdAt.getTime())) {
          errorLogs.push(`Thời gian không hợp lệ: ${orderCode} - "${timeStr}"`);
          txError++;
          continue;
        }

        const amount = parseInt(order.SubTotal || order.subtotal || "0") || 0;
        const balanceBefore = runningBalance;
        const balanceAfter = runningBalance - amount;
        runningBalance = balanceAfter;

        await prisma.transaction.create({
          data: {
            orderCode,
            amount,
            balanceBefore,
            balanceAfter,
            createdAt,
            voucherId: voucherInfo.id,
            storeId,
          },
        });

        txSuccess++;
        if (txSuccess % 200 === 0) {
          console.log(`   ...đã migrate ${txSuccess} transactions`);
        }
      } catch (err: any) {
        errorLogs.push(`Lỗi transaction: ${err.message}`);
        txError++;
      }
    }
  }
  console.log(`✅ Transactions: ${txSuccess} thành công | ${txSkipped} bỏ qua | ${txError} lỗi\n`);

  // In lỗi nếu có
  if (errorLogs.length > 0) {
    console.log("⚠️  Danh sách lỗi:");
    errorLogs.forEach(e => console.log(`   - ${e}`));
  }

  console.log("\n🎉 Migrate hoàn tất!");
}

// Parse DD/MM/YYYY HH:MM:SS → Date
function parseDateTime(str: string): Date {
  const parts = str.split(" ");
  if (parts.length === 2) {
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      return new Date(
        `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}T${parts[1]}`
      );
    }
  }
  return new Date(str);
}

// Trả về timestamp để sort
function parseTime(str: string): number {
  return parseDateTime(str).getTime();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());