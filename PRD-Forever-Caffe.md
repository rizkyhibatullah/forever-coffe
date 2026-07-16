# Product Requirements Document (PRD)
## Forever Caffe — Aplikasi Point of Sale & Manajemen UMKM Kafe Kampus

| | |
|---|---|
| **Nama Produk** | Forever Caffe |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 16 Juli 2026 |
| **Jenis Dokumen** | Product Requirements Document |
| **Target Deploy** | Vercel / Netlify (Free Tier) |
| **Tech Stack** | Fullstack JavaScript |

---

## 1. Latar Belakang & Tujuan

Forever Caffe adalah pelaku UMKM makanan/minuman yang berlokasi di sekitar area kampus. Saat ini pencatatan transaksi, stok, dan keuntungan masih dilakukan secara manual, sehingga rawan kesalahan pencatatan dan sulit dipantau secara real-time.

Aplikasi ini dibangun untuk membantu Forever Caffe:
- Mencatat transaksi penjualan secara digital dan cepat (kasir/POS).
- Mengelola stok bahan/menu secara otomatis setiap terjadi transaksi.
- Melihat rekap keuntungan harian/mingguan/bulanan.
- Memisahkan kategori produk (makanan vs minuman, dan sub-kategori lain).
- Menerima pembayaran non-tunai via QRIS (statis, berupa gambar/foto QRIS pribadi).
- Tampil dengan UI/UX modern, hangat, dan personal — mencerminkan identitas kafe, bukan tampilan generik/template AI.

### 1.1 Target Pengguna
- **Owner/Admin Forever Caffe** — mengelola menu, stok, harga, laporan keuntungan.
- **Kasir (Staff)** — memproses transaksi penjualan harian.
- **Pelanggan (opsional, fase lanjut)** — melihat menu digital / QR menu di meja.

### 1.2 Ruang Lingkup (Scope) MVP
Termasuk dalam MVP:
- Desain UI modern & menarik lengkap dengan gambar & harga produk.
- Modul transaksi jual-beli (kasir).
- Modul stok (tambah/kurang otomatis & manual).
- Modul rekap keuntungan.
- Kategori/pemisahan produk.
- Pembayaran QRIS (gambar statis, konfirmasi manual oleh kasir).

Di luar scope MVP (fase lanjutan):
- Integrasi QRIS dinamis via payment gateway (Midtrans/Xendit) yang butuh biaya/verifikasi merchant.
- Aplikasi mobile native.
- Sistem loyalitas member/poin.
- Multi-cabang.

---

## 2. Prinsip Desain (Design Direction)

Agar tidak terkesan "dibuat AI" atau template generik, desain harus mengikuti prinsip berikut:

- **Tema visual**: Warna hangat khas kedai kopi — krem, cokelat tua, oranye burnt/terracotta, dengan aksen krem/off-white sebagai latar, dipadukan tipografi serif untuk judul (mis. *Fraunces*, *Playfair Display*) dan sans-serif untuk isi (mis. *Inter*, *Manrope*) — bukan kombinasi default seperti Poppins+Roboto yang terasa generik.
- **Tidak simetris kaku**: Gunakan layout dengan variasi ukuran card, overlap elemen, sudut membulat tidak seragam (organic), foto produk dengan crop natural, bukan grid kotak-kotak sempurna ala template.
- **Micro-interaction**: hover state pada kartu menu, transisi halus saat menambah ke keranjang, animasi angka pada dashboard.
- **Fotografi produk**: gunakan foto asli menu (upload owner), rasio konsisten (mis. 4:5), dengan overlay gradient tipis saat menampilkan harga di atas gambar.
- **Personal branding**: logo/nama "Forever Caffe" custom, tagline, dan elemen custom illustration (garis kopi, biji kopi) sebagai aksen bukan clip-art umum.
- **Dark mode opsional** untuk tampilan kasir malam hari.

Referensi arah desain: kombinasi antara *specialty coffee shop branding* modern (seperti Kopi Kenangan/Fore versi indie) dengan sentuhan hangat buatan tangan (hand-drawn accent, bukan flat generic icon pack).

---

## 3. Tech Stack (Fullstack JavaScript)

Dipilih agar 100% kompatibel dengan **Vercel** atau **Netlify Free Tier** tanpa server terpisah.

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend Framework | **Next.js 14+ (App Router)** | SSR/SSG, deploy native di Vercel, free tier generous |
| Styling | **Tailwind CSS** + custom design tokens | Cepat, mudah dikustom agar tidak terlihat template |
| UI Animasi | **Framer Motion** | Micro-interaction halus |
| Backend/API | **Next.js API Routes / Route Handlers** (Node.js) | Fullstack dalam satu project, cocok untuk serverless function di Vercel/Netlify |
| Database | **Supabase (PostgreSQL)** atau **MongoDB Atlas (Free Tier)** | Free tier tersedia, mudah diakses dari serverless function |
| ORM | **Prisma** (jika Postgres) atau **Mongoose** (jika MongoDB) | Type-safe query |
| Autentikasi | **NextAuth.js / Auth.js** | Login owner & kasir (role-based) |
| Storage Gambar | **Supabase Storage** / **Cloudinary Free Tier** | Simpan foto menu & gambar QRIS |
| State Management | **Zustand** atau React Context | Ringan untuk keranjang transaksi |
| Deployment | **Vercel** (rekomendasi utama) atau **Netlify** | Free tier, auto-deploy dari GitHub |
| Version Control | **GitHub** | CI/CD otomatis ke Vercel/Netlify |

> **Catatan integrasi Free Tier**: Vercel Free (Hobby) mendukung Next.js App Router penuh termasuk API Routes/serverless functions. Supabase Free Tier menyediakan Postgres 500MB + Auth + Storage 1GB yang cukup untuk skala UMKM. Kombinasi Next.js + Supabase + Vercel adalah stack paling stabil untuk kebutuhan ini di free tier.

---

## 4. Kebutuhan Fungsional (Functional Requirements)

### FR-1. Desain Katalog Produk (Menu Digital)
- Menampilkan produk dalam bentuk card dengan **gambar, nama, deskripsi singkat, harga, dan status stok**.
- Filter/pencarian produk.
- Badge status: "Tersedia", "Stok Menipis", "Habis".
- Halaman detail produk (opsional varian: ukuran, level gula, dsb).

### FR-2. Transaksi Jual-Beli (Kasir/POS)
- Kasir dapat memilih produk → masuk ke keranjang (cart).
- Kasir dapat mengubah jumlah (qty), menghapus item.
- Kalkulasi otomatis: subtotal, pajak/diskon (opsional), total.
- Pilihan metode pembayaran: **Tunai** atau **QRIS**.
- Untuk QRIS: sistem menampilkan gambar QRIS statis milik owner + tombol "Konfirmasi Pembayaran Diterima" (manual oleh kasir, karena QRIS statis tidak punya webhook otomatis).
- Struk transaksi digital (bisa dicetak/diunduh sebagai bukti).
- Riwayat transaksi tersimpan dengan timestamp, kasir yang bertugas, dan detail item.

### FR-3. Manajemen Stok
- Setiap transaksi berhasil → stok produk otomatis berkurang sesuai qty terjual.
- Owner/Admin dapat menambah stok manual (mis. saat restock bahan).
- Owner/Admin dapat mengurangi stok manual (mis. produk rusak/kadaluarsa).
- Riwayat mutasi stok (log: siapa, kapan, jumlah, alasan).
- Notifikasi/alert saat stok mencapai ambang minimum (low-stock alert).

### FR-4. Rekap Keuntungan
- Input **harga modal (HPP)** per produk saat pembuatan menu.
- Kalkulasi otomatis: `Keuntungan = (Harga Jual - Harga Modal) x Qty Terjual`.
- Dashboard rekap: **harian, mingguan, bulanan**, dan custom range tanggal.
- Grafik visual (bar chart/line chart) tren penjualan & keuntungan.
- Produk terlaris (best seller) & produk kurang laku.
- Export laporan ke **PDF/Excel/CSV**.

### FR-5. Pemisahan Kategori Produk
- Kategori utama: **Makanan** & **Minuman**.
- Sub-kategori fleksibel (mis. Minuman: Kopi, Non-Kopi, Teh; Makanan: Snack, Main Course).
- Owner dapat menambah/mengedit/menghapus kategori sendiri (custom, tidak hardcode).
- Filter menu berdasarkan kategori di halaman katalog & kasir.

### FR-6. Pembayaran QRIS
- Owner mengunggah **gambar QRIS pribadi** (statis, dari rekening bank/e-wallet pribadi) melalui halaman pengaturan.
- Saat transaksi memilih QRIS, sistem menampilkan gambar tersebut sebagai modal pembayaran.
- Karena QRIS statis tidak memiliki callback otomatis, status transaksi dikonfirmasi manual oleh kasir setelah memverifikasi pembayaran masuk (via notifikasi bank/e-wallet).
- *(Fase lanjut, opsional)*: integrasi QRIS dinamis via payment gateway (Midtrans/Xendit) untuk konfirmasi otomatis — tidak termasuk MVP karena berbayar/butuh verifikasi merchant.

### FR-7. Manajemen Pengguna & Role
- **Owner/Admin**: akses penuh (kelola produk, stok, laporan, pengaturan QRIS, kelola akun kasir).
- **Kasir**: akses terbatas (hanya transaksi & lihat stok, tanpa lihat rekap keuntungan/HPP).
- Login dengan email/password (NextAuth.js).

---

## 5. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Performa** | Waktu muat halaman < 2 detik pada koneksi 4G |
| **Responsif** | Mobile-first (kasir sering pakai tablet/HP), tetap optimal di desktop |
| **Keamanan** | Password ter-hash (bcrypt), proteksi role-based access control (RBAC) |
| **Ketersediaan** | Uptime mengikuti SLA Vercel/Netlify Free Tier (cukup untuk skala UMKM) |
| **Skalabilitas** | Desain database mendukung penambahan cabang/multi-outlet di masa depan |
| **Biaya** | Rp 0 (full free tier: Vercel/Netlify + Supabase/MongoDB Atlas free plan) |
| **Aksesibilitas** | Kontras warna memadai (WCAG AA), ukuran tap target sesuai standar mobile |

---

## 6. Struktur Data (Skema Awal)

```
User (id, name, email, password_hash, role[owner|kasir], created_at)

Category (id, name, type[makanan|minuman], created_by)

Product (id, name, description, price, cost_price, image_url,
         category_id, stock_qty, min_stock_alert, is_active)

StockLog (id, product_id, change_qty, type[in|out|sale],
          reason, created_by, created_at)

Transaction (id, invoice_no, cashier_id, payment_method[cash|qris],
             subtotal, discount, total, status[pending|paid], created_at)

TransactionItem (id, transaction_id, product_id, qty, price_at_sale, subtotal)

Settings (id, qris_image_url, cafe_name, cafe_logo, tax_percentage)
```

---

## 7. Alur Pengguna Utama (User Flow)

1. **Kasir login** → masuk ke halaman kasir/POS.
2. **Pilih produk** dari katalog (sudah terfilter by kategori) → tambah ke keranjang.
3. **Review keranjang** → pilih metode bayar (tunai/QRIS).
4. Jika QRIS → tampil gambar QRIS → pelanggan scan & bayar → kasir klik "Konfirmasi Diterima".
5. **Transaksi tersimpan** → stok otomatis berkurang → struk digital muncul.
6. **Owner login** → buka dashboard → lihat rekap keuntungan, grafik, dan kelola stok/menu.

---

## 8. Rencana Deployment (Free Tier)

1. Push project ke **GitHub repository**.
2. Buat project database di **Supabase** (free tier) → catat connection string.
3. Hubungkan repo GitHub ke **Vercel** (atau Netlify) → set environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, dll).
4. Vercel otomatis build & deploy setiap push ke branch `main` (CI/CD).
5. Domain gratis bawaan: `forever-caffe.vercel.app` (bisa custom domain nanti).
6. Migrasi database (Prisma) dijalankan via `prisma migrate deploy` pada saat build/deploy.

---

## 9. Milestone Pengembangan (Roadmap MVP)

| Fase | Fitur | Estimasi |
|---|---|---|
| Fase 1 | Setup project, desain UI/UX (katalog, kasir), auth | 1–2 minggu |
| Fase 2 | Modul transaksi + integrasi stok otomatis | 1 minggu |
| Fase 3 | Modul rekap keuntungan + dashboard grafik | 1 minggu |
| Fase 4 | Modul kategori produk + pengaturan QRIS | 3–4 hari |
| Fase 5 | Testing, polish UI/animasi, deploy ke Vercel | 3–5 hari |

---

## 10. Metrik Keberhasilan (Success Metrics)

- Waktu transaksi per pelanggan berkurang (target: < 30 detik/transaksi).
- Kesalahan pencatatan stok manual berkurang mendekati 0%.
- Owner dapat melihat laporan keuntungan real-time tanpa hitung manual.
- UI mendapat kesan "modern & profesional" dari uji coba pengguna (owner & kasir).

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| QRIS statis rawan human error (kasir lupa konfirmasi) | Tambahkan reminder/notifikasi visual saat status masih "pending" |
| Free tier database ada batas kapasitas | Arsipkan transaksi lama secara berkala, monitor usage |
| Serverless function cold start di Netlify/Vercel free tier | Optimalkan query & gunakan caching (SWR/React Query) |

---

*Dokumen ini adalah acuan awal (MVP) dan dapat berkembang seiring masukan dari owner Forever Caffe selama proses pengembangan.*
