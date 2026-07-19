# Forever Café

Aplikasi manajemen kafe berbasis web dengan fitur POS, manajemen stok, dan laporan keuangan.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Auth:** NextAuth.js
- **Styling:** Tailwind CSS 4

## Persyaratan

- Node.js 20+
- npm

## Cara Menjalankan

1. **Clone repositori**

   ```bash
   git clone https://github.com/rizkyhibatullah/forever-coffe.git
   cd forever-coffe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   Perintah ini akan otomatis menjalankan `prisma generate` melalui `postinstall`.

3. **Konfigurasi environment**

   Buat file `.env` di root proyek:

   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

   - `DATABASE_URL`: URL koneksi PostgreSQL (gunakan connection pooling untuk production)
   - `NEXTAUTH_SECRET`: Secret key untuk NextAuth (bisa digenerate dengan `openssl rand -base64 32`)
   - `NEXTAUTH_URL`: URL aplikasi saat development (`http://localhost:3000`)

4. **Jalankan migrasi database**

   ```bash
   npx prisma migrate dev
   ```

5. **Jalankan development server**

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Jalankan ESLint |
| `npx prisma studio` | Buka Prisma Studio (GUI database) |
| `npx prisma migrate dev` | Jalankan migrasi database |
| `npx prisma generate` | Generate Prisma Client |

## Deploy ke Vercel

1. Push ke GitHub
2. Hubungkan repositori ke Vercel
3. Set environment variables di dashboard Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (sesuaikan dengan domain Vercel)
4. Deploy
