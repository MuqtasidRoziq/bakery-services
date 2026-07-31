# 🍞 Bakery Services API

Backend REST API untuk aplikasi mobile **Bakery Hub** — platform pemesanan produk bakery (roti, kue, dan pastry) berbasis Express.js + Prisma + PostgreSQL.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Arsitektur Proyek](#-arsitektur-proyek)
- [Database Schema](#-database-schema)
- [Instalasi & Setup](#-instalasi--setup)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Reference](#-api-reference)
  - [Health Check](#health-check)
  - [Auth](#auth-apiv1auth)
  - [Users](#users-apiv1users)
  - [Products](#products-apiv1products)
  - [Orders](#orders-apiv1orders)
  - [Admin](#admin-apiv1admin)
- [Response Format](#-response-format)
- [Autentikasi](#-autentikasi)
- [Rate Limiting](#-rate-limiting)
- [Deploy ke Netlify](#-deploy-ke-netlify)
- [Database Seeding](#-database-seeding)

---

## 🛠 Tech Stack

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **Node.js** | >= 18 | Runtime JavaScript |
| **TypeScript** | ^7.0 | Type safety |
| **Express.js** | ^5.2 | HTTP framework |
| **Prisma ORM** | ^7.8 | Database ORM |
| **PostgreSQL** | - | Database (via Supabase) |
| **JWT** | ^9.0 | Autentikasi token |
| **bcryptjs** | ^3.0 | Hashing password |
| **Helmet** | ^8.0 | HTTP security headers |
| **CORS** | ^2.8 | Cross-origin resource sharing |
| **morgan** | ^1.10 | HTTP request logger |
| **serverless-http** | ^4.0 | Wrapping Express untuk Netlify Functions |

---

## 📁 Arsitektur Proyek

```
bakery-services/
├── src/
│   ├── app.ts                  # Express app (middleware, routing)
│   ├── server.ts               # Entry point — listen ke PORT
│   ├── controllers/
│   │   ├── admin/
│   │   │   └── adminController.ts
│   │   ├── auth/
│   │   │   ├── getMeController.ts
│   │   │   ├── loginController.ts
│   │   │   └── registerController.ts
│   │   ├── order/
│   │   │   └── orderController.ts
│   │   ├── product/
│   │   │   └── productController.ts
│   │   └── user/
│   │       └── userController.ts
│   ├── routes/
│   │   ├── adminRoutes.ts
│   │   ├── authRoutes.ts
│   │   ├── orderRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── userRoutes.ts
│   ├── middlewares/
│   │   └── authMiddleware.ts   # JWT verify, role guard (admin/customer)
│   ├── lib/
│   │   └── prisma.ts           # Prisma client singleton
│   └── utils/
│       ├── helpers.ts          # generateOrderNumber, calculateShippingCost
│       ├── jwt.ts              # generateToken, verifyToken
│       └── response.ts         # successResponse, errorResponse
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Data seeder
│   └── migrations/             # Prisma migration files
├── netlify/
│   └── functions/
│       └── api.mts             # Serverless handler untuk Netlify
├── .env.example                # Template environment variables
├── netlify.toml                # Konfigurasi Netlify
├── package.json
└── tsconfig.json
```

---

## 🗄 Database Schema

Database menggunakan **PostgreSQL** (dihosting di Supabase) dengan Prisma ORM.

### Enums

| Enum | Nilai |
|---|---|
| `Role` | `CUSTOMER`, `ADMIN` |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `PaymentStatus` | `UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| `PaymentMethod` | `TRANSFER`, `COD`, `EWALLET` |

### Models

#### `User`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String (unique) | Email pengguna |
| `password` | String | Hashed bcrypt |
| `displayName` | String | Nama tampil |
| `phoneNumber` | String? | Nomor telepon (opsional) |
| `photoUrl` | String? | URL foto profil |
| `role` | Role | Default: `CUSTOMER` |
| `isActive` | Boolean | Default: `true` |
| `addresses` | JSON | Array alamat pengiriman |

#### `Category`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Nama kategori |
| `description` | String? | Deskripsi |
| `imageUrl` | String? | URL gambar |
| `isActive` | Boolean | Default: `true` |

#### `Product`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Nama produk |
| `description` | String | Deskripsi produk |
| `price` | Decimal(12,2) | Harga satuan |
| `stock` | Int | Stok tersedia |
| `categoryId` | UUID? | Relasi ke Category |
| `imageUrl` | String? | URL gambar utama |
| `images` | JSON | Array URL gambar tambahan |
| `weight` | Int | Berat (gram) |
| `unit` | String | Satuan (pcs, loaf, slice) |
| `isAvailable` | Boolean | Ketersediaan produk |
| `rating` | Decimal(3,2)? | Rating rata-rata |
| `totalReviews` | Int | Jumlah review |

#### `Order`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `orderNumber` | String (unique) | Format: `ORD-YYYYMMDD-XXXX` |
| `userId` | UUID | Relasi ke User |
| `customerName` | String | Nama pemesan |
| `customerPhone` | String | Telepon pemesan |
| `shippingAddress` | JSON | Alamat pengiriman |
| `subtotal` | Decimal(12,2) | Total sebelum ongkir |
| `shippingCost` | Decimal(12,2) | Ongkos kirim |
| `discount` | Decimal(12,2) | Diskon, default `0` |
| `totalPrice` | Decimal(12,2) | Total keseluruhan |
| `status` | OrderStatus | Default: `PENDING` |
| `paymentStatus` | PaymentStatus | Default: `UNPAID` |
| `notes` | String? | Catatan tambahan |

#### `OrderItem`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID | Relasi ke Order |
| `productId` | UUID | Relasi ke Product |
| `productName` | String | Snapshot nama produk |
| `productImage` | String? | Snapshot gambar produk |
| `quantity` | Int | Jumlah item |
| `unitPrice` | Decimal(12,2) | Harga per satuan saat order |
| `subtotal` | Decimal(12,2) | unitPrice x quantity |

#### `Payment`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID (unique) | Relasi ke Order |
| `userId` | UUID | Relasi ke User |
| `amount` | Decimal(12,2) | Jumlah pembayaran |
| `method` | PaymentMethod | Metode bayar |
| `status` | PaymentStatus | Default: `PENDING` |
| `referenceNumber` | String? | Nomor referensi transfer |
| `proofImageUrl` | String? | URL bukti transfer |
| `paidAt` | DateTime? | Waktu konfirmasi pembayaran |

#### `Review`
| Field | Tipe | Keterangan |
|---|---|---|
| `id` | UUID | Primary key |
| `productId` | UUID | Relasi ke Product |
| `userId` | UUID | Relasi ke User |
| `userName` | String | Snapshot nama reviewer |
| `userPhotoUrl` | String? | Snapshot foto reviewer |
| `rating` | Int | Rating (1-5) |
| `comment` | String? | Komentar ulasan |

### Entity Relationship Diagram

```
User ---< Order ---< OrderItem >--- Product
User ---< Payment                Product ---< Review
User ---< Review                 Product >--- Category
Order ---  Payment
```

---

## ⚙️ Instalasi & Setup

### Prasyarat

- Node.js >= 18
- npm / pnpm
- Akun Supabase (atau PostgreSQL lokal)

### Langkah-langkah

```bash
# 1. Clone repositori
git clone <repo-url>
cd bakery-services

# 2. Install dependencies
npm install

# 3. Salin file environment
cp .env.example .env
# Edit .env dan isi semua variabel yang diperlukan

# 4. Jalankan migrasi database
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. (Opsional) Seed database dengan data awal
npm run seed
```

---

## 🔑 Environment Variables

Salin `.env.example` menjadi `.env` dan isi nilainya:

```env
PORT=5000
NODE_ENV=development
APP_NAME="Bakery Hub"

# Database (Supabase PostgreSQL)
# DATABASE_URL  = Connection Pooling (port 6543) untuk runtime queries
# DIRECT_URL    = Direct Connection (port 5432) untuk prisma migrate
DATABASE_URL=""
DIRECT_URL=""

# JWT
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=""
JWT_EXPIRES_IN=7d

# bcrypt
BCRYPT_SALT_ROUNDS=12
```

> **Tips Supabase**: Dapatkan URL dari *Project Settings → Database*. Gunakan **Connection Pooling** (port 6543) untuk `DATABASE_URL` dan **Direct Connection** (port 5432) untuk `DIRECT_URL`.

---

## 🚀 Menjalankan Aplikasi

```bash
# Development (hot-reload dengan tsx)
npm run dev

# Build TypeScript ke JavaScript
npm run build

# Production
npm start

# Seed database
npm run seed
```

Server akan berjalan di `http://localhost:5000`.

---

## 📖 API Reference

### Base URL

```
http://localhost:5000/api/v1
```

> Untuk produksi (Netlify): semua request diarahkan ke `/.netlify/functions/api`

---

### Health Check

#### `GET /health`

Mengecek status server.

**Response:**
```json
{
  "success": true,
  "message": "Bakery Services is running!",
  "environment": "development",
  "timestamp": "2026-07-30T03:00:00.000Z"
}
```

---

### Auth `/api/v1/auth`

> Rate limited: Maks **20 request per 15 menit** untuk semua endpoint auth.

#### `POST /auth/register`

Mendaftarkan pengguna baru.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Nama Pengguna",
  "phoneNumber": "08123456789"
}
```

| Field | Tipe | Wajib |
|---|---|---|
| `email` | string | Wajib |
| `password` | string | Wajib |
| `displayName` | string | Wajib |
| `phoneNumber` | string | Opsional |

**Response `201`:**
```json
{
  "success": true,
  "message": "Registrasi berhasil! Silakan login.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Nama Pengguna",
      "phoneNumber": "08123456789",
      "role": "CUSTOMER",
      "createdAt": "2026-07-30T03:00:00.000Z"
    }
  }
}
```

---

#### `POST /auth/login`

Login dan mendapatkan JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Nama Pengguna",
      "phoneNumber": "08123456789",
      "photoUrl": null,
      "role": "CUSTOMER"
    }
  }
}
```

---

#### `GET /auth/me`

Mendapatkan profil pengguna yang sedang login.

> 🔐 Memerlukan autentikasi

**Response `200`:**
```json
{
  "success": true,
  "message": "Profil berhasil diambil",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "Nama Pengguna",
      "role": "CUSTOMER",
      "addresses": [],
      "isActive": true,
      "createdAt": "2026-07-30T03:00:00.000Z",
      "updatedAt": "2026-07-30T03:00:00.000Z"
    }
  }
}
```

---

### Users `/api/v1/users`

> 🔐 Semua endpoint memerlukan autentikasi.

#### `GET /users/profile`

Mendapatkan profil lengkap pengguna termasuk daftar alamat.

**Response `200`:** *(sama seperti `/auth/me`)*

---

#### `PUT /users/profile`

Memperbarui data profil pengguna.

**Request Body (semua field opsional):**
```json
{
  "displayName": "Nama Baru",
  "phoneNumber": "08999999999",
  "photoUrl": "https://example.com/photo.jpg"
}
```

**Response `200`:** Profil berhasil diupdate.

---

#### `POST /users/addresses`

Menambahkan alamat pengiriman baru.

**Request Body:**
```json
{
  "label": "Rumah",
  "street": "Jl. Sudirman No. 10",
  "city": "Jakarta Pusat",
  "province": "DKI Jakarta",
  "postalCode": "10220"
}
```

Semua field wajib diisi.

**Response `201`:** Alamat berhasil ditambahkan.

---

#### `DELETE /users/addresses/:index`

Menghapus alamat berdasarkan indeks (0-based) dalam array.

**Path Parameter:**
- `index` — Nomor indeks alamat yang akan dihapus (dimulai dari `0`)

**Response `200`:** Alamat berhasil dihapus.

---

### Products `/api/v1/products`

#### `GET /products`

Mengambil semua produk. Mendukung filter via query parameter.

> 🌐 Public — tidak memerlukan autentikasi

**Query Parameters (opsional):**
| Parameter | Tipe | Contoh |
|---|---|---|
| `categoryId` | UUID | `?categoryId=abc123` |
| `isAvailable` | boolean | `?isAvailable=true` |

**Response `200`:**
```json
{
  "success": true,
  "message": "10 produk ditemukan",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Roti Coklat Premium",
        "price": "15000.00",
        "stock": 50,
        "isAvailable": true,
        "rating": "4.80",
        "totalReviews": 124,
        "category": { "id": "uuid", "name": "Roti Manis" }
      }
    ]
  }
}
```

---

#### `GET /products/categories`

Mengambil semua kategori produk yang aktif.

> 🌐 Public

**Response `200`:**
```json
{
  "success": true,
  "message": "3 kategori ditemukan",
  "data": {
    "categories": [
      { "id": "uuid", "name": "Kue & Pastry", "description": "...", "imageUrl": null, "isActive": true }
    ]
  }
}
```

---

#### `GET /products/:id`

Mengambil detail produk berdasarkan ID.

> 🌐 Public

**Response `200`:** Detail produk beserta kategori.
**Response `404`:** Produk tidak ditemukan.

---

#### `POST /products`

Membuat produk baru.

> 🔐 Admin only

**Request Body:**
```json
{
  "name": "Nama Produk",
  "description": "Deskripsi produk",
  "price": 25000,
  "stock": 50,
  "categoryId": "uuid-kategori",
  "imageUrl": "https://example.com/image.jpg",
  "images": [],
  "weight": 100,
  "unit": "pcs",
  "isAvailable": true
}
```

| Field | Wajib | Default |
|---|---|---|
| `name` | Wajib | - |
| `price` | Wajib | - |
| `categoryId` | Wajib | - |
| `description` | Opsional | `""` |
| `stock` | Opsional | `0` |
| `weight` | Opsional | `0` |
| `unit` | Opsional | `"pcs"` |
| `isAvailable` | Opsional | `true` |

**Response `201`:** Produk berhasil dibuat.

---

#### `PATCH /products/:id`

Memperbarui data produk (partial update).

> 🔐 Admin only

**Response `200`:** Produk berhasil diupdate.

---

#### `DELETE /products/:id`

Menghapus produk.

> 🔐 Admin only

**Response `200`:** Produk berhasil dihapus.

---

#### `POST /products/categories`

Membuat kategori produk baru.

> 🔐 Admin only

**Request Body:**
```json
{
  "name": "Nama Kategori",
  "description": "Deskripsi kategori",
  "imageUrl": "https://example.com/category.jpg"
}
```

**Response `201`:** Kategori berhasil dibuat.

---

### Orders `/api/v1/orders`

#### `POST /orders`

Membuat pesanan baru.

> 🔐 Customer only

**Request Body:**
```json
{
  "customerName": "Nama Pemesan",
  "customerPhone": "08123456789",
  "shippingAddress": {
    "label": "Rumah",
    "street": "Jl. Merdeka No. 5",
    "city": "Bandung",
    "province": "Jawa Barat",
    "postalCode": "40111"
  },
  "items": [
    { "productId": "uuid-produk-1", "quantity": 2 },
    { "productId": "uuid-produk-2", "quantity": 1 }
  ],
  "notes": "Tolong dikemas rapi"
}
```

**Logika Perhitungan Ongkos Kirim:**
| Subtotal | Ongkos Kirim |
|---|---|
| >= Rp300.000 | Gratis (Rp0) |
| >= Rp150.000 | Rp10.000 |
| < Rp150.000 | Rp20.000 |

**Response `201`:**
```json
{
  "success": true,
  "message": "Order berhasil dibuat",
  "data": {
    "order": {
      "id": "uuid",
      "orderNumber": "ORD-20260730-1234",
      "status": "PENDING",
      "paymentStatus": "UNPAID",
      "subtotal": "32000.00",
      "shippingCost": "10000.00",
      "totalPrice": "42000.00",
      "items": [ ... ]
    }
  }
}
```

---

#### `GET /orders/my`

Mengambil semua pesanan milik pengguna yang login.

> 🔐 Customer only

**Response `200`:** Daftar order beserta items dan data payment.

---

#### `GET /orders/:id`

Mengambil detail pesanan berdasarkan ID.

> 🔐 Autentikasi wajib (customer hanya bisa akses order miliknya, admin bisa semua)

**Response `200`:** Detail order.
**Response `403`:** Akses ditolak.

---

#### `GET /orders`

Mengambil semua pesanan dari seluruh user.

> 🔐 Admin only

**Response `200`:** Semua order diurutkan terbaru.

---

#### `PATCH /orders/:id/cancel`

Membatalkan pesanan.

> 🔐 Customer only | Order harus berstatus `PENDING`

**Response `200`:** Order dibatalkan, status berubah ke `CANCELLED`.
**Response `400`:** Jika order tidak berstatus `PENDING`.

---

#### `PATCH /orders/:id/status`

Memperbarui status pesanan.

> 🔐 Admin only

**Request Body:**
```json
{ "status": "PROCESSING" }
```

Nilai valid: `PENDING` | `CONFIRMED` | `PROCESSING` | `SHIPPED` | `DELIVERED` | `CANCELLED`

---

#### `POST /orders/:id/payment`

Mengajukan pembayaran untuk pesanan.

> 🔐 Customer only

**Request Body:**
```json
{
  "method": "TRANSFER",
  "referenceNumber": "TRF-20260730-001",
  "proofImageUrl": "https://example.com/bukti.jpg"
}
```

| Field | Wajib | Nilai |
|---|---|---|
| `method` | Wajib | `TRANSFER`, `COD`, `EWALLET` |
| `referenceNumber` | Opsional | Nomor referensi |
| `proofImageUrl` | Opsional | URL bukti bayar |

**Response `201`:** Payment berhasil diajukan, `paymentStatus` order berubah ke `PENDING`.

---

#### `PATCH /orders/payments/:paymentId/confirm`

Mengkonfirmasi pembayaran.

> 🔐 Admin only

**Response `200`:** Payment terkonfirmasi. Status payment menjadi `PAID`, status order menjadi `CONFIRMED`.

---

### Admin `/api/v1/admin`

> 🔐 Semua endpoint memerlukan autentikasi **Admin**.

#### `GET /admin/users`

Mengambil semua data pengguna terdaftar.

**Response `200`:**
```json
{
  "success": true,
  "message": "5 user ditemukan",
  "data": {
    "users": [
      { "id": "uuid", "email": "...", "displayName": "...", "role": "CUSTOMER", "isActive": true }
    ]
  }
}
```

---

#### `POST /admin/users/:id/set-admin`

Menjadikan pengguna sebagai admin (role: `ADMIN`).

**Response `200`:** Role berhasil diubah ke ADMIN.

---

#### `DELETE /admin/users/:id/set-admin`

Mencabut hak admin, mengembalikan role ke `CUSTOMER`.

**Response `200`:** Role admin berhasil dicabut.

---

#### `PATCH /admin/users/:id/deactivate`

Menonaktifkan akun pengguna (`isActive: false`).

**Response `200`:** User berhasil dinonaktifkan.

---

## 📦 Response Format

Semua endpoint menggunakan format response yang konsisten:

**Success:**
```json
{
  "success": true,
  "message": "Pesan deskriptif",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Pesan error"
}
```

### HTTP Status Codes

| Kode | Keterangan |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request — validasi gagal |
| `401` | Unauthorized — token tidak ada / tidak valid |
| `403` | Forbidden — role tidak sesuai |
| `404` | Not Found — resource tidak ditemukan |
| `429` | Too Many Requests — rate limit tercapai |
| `500` | Internal Server Error |

---

## 🔐 Autentikasi

API menggunakan **JWT (JSON Web Token)** untuk autentikasi.

### Cara Menggunakan Token

Sertakan token di setiap request yang memerlukan autentikasi:

```
Authorization: Bearer <token>
```

Token diperoleh dari endpoint `/auth/login`. Token berlaku selama `JWT_EXPIRES_IN` (default: `7d`).

### Hierarki Role

| Role | Akses |
|---|---|
| `ADMIN` | Akses penuh ke semua endpoint |
| `CUSTOMER` | Profil sendiri, order sendiri |
| Public | Membaca produk & kategori saja |

---

## ⏱ Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| **Global** (semua endpoint) | 200 request | per 15 menit |
| **Auth** (`/api/v1/auth/*`) | 20 request | per 15 menit |

Jika limit tercapai, server mengembalikan HTTP `429`.

---

## ☁️ Deploy ke Netlify

Proyek dikonfigurasi untuk deploy ke **Netlify Functions** (serverless).

### Cara Kerja

```
Client Request
     ↓
Netlify Redirect (netlify.toml: /* → /.netlify/functions/api)
     ↓
serverless-http wraps Express app
     ↓
Express routes & controllers
```

### Konfigurasi (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@prisma/client"]

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/api"
  status = 200
```

### Environment Variables di Netlify

Tambahkan semua variabel dari `.env.example` ke **Netlify Dashboard → Site Settings → Environment Variables**.

---

## 🌱 Database Seeding

Jalankan seeder untuk mengisi data awal:

```bash
npm run seed
```

**Admin default:**
| Email | Password |
|---|---|
| `admin@bakeryhub.com` | `Admin@12345` |

**Kategori yang dibuat:** Roti Manis, Kue & Pastry, Roti Gurih

**Produk yang dibuat (10 item):**

| Nama | Harga | Kategori |
|---|---|---|
| Roti Coklat Premium | Rp15.000 | Roti Manis |
| Roti Keju Susu | Rp18.000 | Roti Manis |
| Roti Sobek Pandan | Rp28.000 | Roti Manis |
| Roti Sosis Mayo | Rp16.000 | Roti Gurih |
| Roti Abon Sapi | Rp20.000 | Roti Gurih |
| Garlic Bread Cream Cheese | Rp30.000 | Roti Gurih |
| Croissant Butter | Rp25.000 | Kue & Pastry |
| Almond Croissant | Rp32.000 | Kue & Pastry |
| Choco Lava Cake | Rp35.000 | Kue & Pastry |
| Tiramisu Slice Cake | Rp40.000 | Kue & Pastry |

> Seeder bersifat **idempotent** — aman dijalankan berulang kali tanpa duplikasi data.

---

## 🧩 Middleware

### `authMiddleware`
Memverifikasi JWT dari header `Authorization: Bearer <token>`. Menyisipkan data user ke `req.user`.

### `adminMiddleware`
Memastikan `req.user.role === "ADMIN"`. Harus dipasang setelah `authMiddleware`.

### `customerMiddleware`
Memastikan `req.user.role === "CUSTOMER"`. Harus dipasang setelah `authMiddleware`.

---

## 🛠 Utility Functions

### `generateOrderNumber()`
Format: `ORD-YYYYMMDD-XXXX` — contoh: `ORD-20260730-4823`

### `calculateShippingCost(subtotal)`
| Subtotal | Ongkos Kirim |
|---|---|
| >= Rp300.000 | Gratis (Rp0) |
| >= Rp150.000 | Rp10.000 |
| < Rp150.000 | Rp20.000 |

### `generateToken(payload)` & `verifyToken(token)`
Wrapper untuk sign dan verify JWT menggunakan `jsonwebtoken`.

### `successResponse(res, message, data, statusCode)`
Helper untuk response sukses dengan format konsisten.

### `errorResponse(res, message, statusCode)`
Helper untuk response error dengan format konsisten.

---

*Dibuat untuk keperluan Sertifikasi Kompetensi — Bakery Hub Mobile App Backend.*
