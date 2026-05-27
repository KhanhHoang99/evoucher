import { PrismaClient } from "../prisma/generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: "postgresql://evoucher_user:evoucher_pass@localhost:5432/evoucher_db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("✅ User admin:", admin.username);



 // Store mẫu
  const store = await prisma.store.upsert({
    where: { storeCode: "CH57" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      storeCode: "CH57",
      name: "Cửa hàng 57 Lê Duẩn",
      location: "Đà Nẵng",
      isActive: true,
    },
  });
  console.log("✅ Store:", store.name);

  // Cashier mẫu
  const cashierHash = await bcrypt.hash("57leduan", 10);
  const cashier = await prisma.user.upsert({
    where: { username: "ch57" },
    update: {},
    create: {
      username: "ch57",
      passwordHash: cashierHash,
      role: "CASHIER",
      isActive: true,
      storeId: "00000000-0000-0000-0000-000000000002",
    },
  });
  console.log("✅ Cashier:", cashier.username);


  // Partner mẫu
  const partner = await prisma.partner.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Cảng Đà Nẵng",
      isActive: true,
    },
  });
  console.log("✅ Partner:", partner.name);

  // Voucher mẫu
  const voucher = await prisma.voucher.upsert({
    where: { voucherCode: "2501000000017" },
    update: {},
    create: {
      voucherCode: "2501000000017",
      holderName: "Nguyễn Đình Chung",
      holderPhone: null,
      initialAmount: 6000000,
      balance: 6000000,
      status: "ACTIVE",
      expiresAt: new Date("2026-12-31"),
      partnerId: "00000000-0000-0000-0000-000000000001",
    },
  });
  console.log("✅ Voucher:", voucher.voucherCode);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());