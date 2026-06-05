# eVoucher System — Project Context

> **ĐỌC FILE NÀY TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ.**
> Đây là toàn bộ context của dự án. AI mới vào chỉ cần đọc file này là hiểu ngay và làm tiếp được.

---

## Bối cảnh nghiệp vụ

Công ty BQ bán thẻ trả trước (prepaid card) cho các đối tác (partner). Partner tặng thẻ cho nhân viên của họ. Nhân viên partner đến **8 cửa hàng** của BQ mua sắm và thanh toán bằng thẻ. Nhân viên cửa hàng quét mã thẻ → hệ thống hiển thị số dư → xác nhận trừ tiền. Partner **không có tài khoản** trong hệ thống.

### Luồng nghiệp vụ chính

```
Công ty phát hành thẻ → Bán cho Partner (B2B)
→ Partner tặng thẻ cho nhân viên của họ
→ Nhân viên partner đến cửa hàng mua sắm
→ Nhân viên cửa hàng quét mã thẻ → xem số dư → xác nhận thanh toán
→ Nếu partner hỏi → ADMIN/VIEWER xuất báo cáo Excel gửi cho họ
```

---

## Kiến trúc hệ thống

| Thành phần | Công nghệ |
|---|---|
| Frontend + Backend | Next.js 15 + TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma v7 |
| Container | Docker + Docker Compose |
| Xác thực | JWT (jose) + bcryptjs |
| Styling | Tailwind CSS + Inline styles |
| Xuất Excel | xlsx + file-saver |

**Môi trường:**
- Máy dev: Windows + Docker Desktop + VSCode
- Project tại: `D:\evoucher\`
- Server production: Windows Server 2016 Standard
- Node.js: v22.18.0

---

## Database — 5 bảng

**Enum:**
```
VoucherStatus: ACTIVE / EXPIRED / DISABLED / USED
Role:          ADMIN / VIEWER / CASHIER
Transaction type: PAYMENT / ADJUSTMENT
```

**Cột đặc biệt trong transactions:**
```
type        — PAYMENT hoặc ADJUSTMENT
reason      — Lý do điều chỉnh (bắt buộc khi ADJUSTMENT)
adjustedBy  — uuid admin thực hiện
storeId     — nullable (null khi ADJUSTMENT)
```

---

## Phân quyền — 3 role

| Role | storeId | Quyền |
|---|---|---|
| ADMIN | null | Toàn quyền + xuất báo cáo |
| VIEWER | null | Chỉ xem + xuất báo cáo |
| CASHIER | Bắt buộc | Quét thẻ, thanh toán, xem lịch sử |

**Bảo vệ route middleware.ts:**
- /admin/* → chỉ ADMIN
- /viewer/* → ADMIN + VIEWER  
- /cashier* → chỉ CASHIER
- Token: cookie cho page routes, Authorization header cho API routes

---

## Tài khoản test

| Username | Password | Role | Cửa hàng |
|---|---|---|---|
| admin | admin123 | ADMIN | — |
| ch57 | 57leduan | CASHIER | Cửa hàng 57 Lê Duẩn |
| ch49 | (xem DB) | CASHIER | Cửa hàng 49 |

---

## Cấu trúc thư mục

```
D:\evoucher\
├── app/
│   ├── login/page.tsx                         ✅ Trang đăng nhập
│   ├── cashier/
│   │   ├── page.tsx                           ✅ Quét thẻ + thanh toán
│   │   └── history/page.tsx                   ✅ Lịch sử bán hàng
│   ├── admin/
│   │   ├── layout.tsx                         ✅ Sidebar cam #E8440A
│   │   ├── dashboard/page.tsx                 ✅ Thống kê + biểu đồ
│   │   ├── import/page.tsx                    ✅ Import Excel
│   │   ├── vouchers/page.tsx                  ✅ Danh sách thẻ + điều chỉnh
│   │   ├── transactions/page.tsx              ✅ Lịch sử + filter
│   │   ├── stores/page.tsx                    ✅ Quản lý cửa hàng
│   │   ├── users/page.tsx                     ✅ Quản lý user
│   │   └── partners/page.tsx                  ✅ Quản lý partner
│   ├── viewer/
│   │   ├── layout.tsx                         ✅ Sidebar xanh #2563eb
│   │   ├── dashboard/page.tsx                 ✅ Dashboard chỉ xem
│   │   ├── transactions/page.tsx              ✅ Lịch sử giao dịch
│   │   ├── vouchers/page.tsx                  ✅ Danh sách thẻ
│   │   └── reports/page.tsx                   ✅ Xuất báo cáo partner + cửa hàng
│   └── api/
│       ├── auth/login/route.ts                ✅ POST đăng nhập
│       ├── voucher/[code]/route.ts            ✅ GET quét thẻ
│       ├── voucher/[code]/phone/route.ts      ✅ PATCH cập nhật SĐT
│       ├── voucher/[code]/adjust/route.ts     ✅ POST điều chỉnh số dư
│       ├── vouchers/route.ts                  ✅ GET danh sách thẻ
│       ├── vouchers/import/route.ts           ✅ POST import Excel
│       ├── payment/route.ts                   ✅ POST thanh toán
│       ├── transactions/route.ts              ✅ GET lịch sử + filter
│       ├── stats/route.ts                     ✅ GET thống kê dashboard
│       ├── reports/route.ts                   ✅ GET báo cáo partner + cửa hàng
│       ├── stores/route.ts                    ✅ GET + POST
│       ├── stores/[id]/route.ts               ✅ PATCH sửa/khóa
│       ├── users/route.ts                     ✅ GET + POST
│       ├── users/[id]/route.ts                ✅ PATCH sửa/khóa
│       ├── users/[id]/reset-password/route.ts ✅ PATCH reset mật khẩu
│       ├── partners/route.ts                  ✅ GET + POST
│       └── partners/[id]/route.ts             ✅ PATCH sửa/khóa
├── lib/prisma.ts                              ✅ Prisma Client dùng chung
├── middleware.ts                               ✅ JWT + phân quyền
├── prisma/
│   ├── schema.prisma                          ✅ Schema 5 bảng
│   ├── seed.ts                                ✅ Data mẫu
│   ├── migrate-old-data.ts                    ✅ Script migrate CSV
│   ├── customer_info.csv                      ✅ 824 vouchers đã migrate
│   └── order_history.csv                      ✅ 2301 transactions đã migrate
├── prisma.config.ts                           ✅
├── docker-compose.yml                         ✅
└── .env                                       ✅
```

---

## Tính năng đặc biệt

### Điều chỉnh số dư (ADJUSTMENT)
- Admin hoàn tiền hoặc trừ thêm khi thu nhầm
- Ghi log: type=ADJUSTMENT, reason bắt buộc, adjustedBy
- storeId = null, mã đơn bắt đầu bằng ADJ

### Lịch sử thẻ toàn hệ thống
- CASHIER xem lịch sử 1 thẻ trên TẤT CẢ cửa hàng
- Logic: khi có voucherCode thì bỏ giới hạn storeId trong api/transactions

### Import Excel
- Cột bắt buộc: Họ và tên, Công ty, Mức voucher, Mã thẻ, Ngày hết hạn
- SĐT không bắt buộc
- Tự động tạo partner nếu chưa có (mode: insensitive)

### Popup lỗi thẻ Cashier
- API trả về expiresAt + holderName kèm message lỗi
- Hiển thị popup với thông tin chi tiết

### Xuất báo cáo Excel
- Theo partner: danh sách thẻ + sheet tổng hợp
- Theo cửa hàng: mỗi store 1 sheet + sheet tổng hợp
- Có xem trước trước khi xuất

---

## Ràng buộc kỹ thuật — ĐỌC KỸ

- **Prisma v7**: KHÔNG dùng url trong schema.prisma → cấu hình trong prisma.config.ts
- **Import Prisma Client**: dùng ../prisma/generated/client.js
- **package.json**: có "type": "module"
- **Token**: lưu cả localStorage (API) VÀ cookie (middleware)
- **Đăng xuất**: xóa cả localStorage VÀ cookie
- **Race condition**: API thanh toán dùng prisma.$transaction
- **Tên partner**: kiểm tra trùng mode: "insensitive" ở 3 chỗ
- **Sau khi đổi schema**: npx prisma generate + restart npm run dev

---

## Lệnh thường dùng

```bash
docker-compose up -d postgres   # Khởi động PostgreSQL
npm run dev                     # Chạy dev server
npx prisma studio               # Xem database
npx prisma migrate dev --name x # Tạo migration mới
npx prisma generate             # Generate lại Prisma Client
npm run seed                    # Tạo data mẫu
npm run migrate-old             # Migrate data từ hệ thống cũ
```

---

## Trạng thái hiện tại

### ✅ Hoàn thành
- Phase 1: Setup môi trường
- Phase 2: Tất cả Backend API
- Phase 3: Tất cả Frontend (Admin + Viewer + Cashier)
- Migrate 824 vouchers + 2301 transactions từ MySQL cũ

### ⏳ Còn pending
- Phase 4 — Deploy lên Windows Server 2016:
  1. Tạo Dockerfile cho Next.js
  2. Cấu hình docker-compose production
  3. Deploy lên server
  4. Test song song 2 hệ thống
  5. Go live

- Dọn dẹp: xóa/khóa partner "Cảng Đà Nẵng" test (6 thẻ) trùng với partner thật (818 thẻ)
