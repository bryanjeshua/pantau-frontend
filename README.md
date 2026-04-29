# PANTAU — Platform Audit Keuangan Daerah

**PANTAU** adalah platform audit keuangan daerah berbasis AI yang membantu auditor pemerintah mendeteksi risiko, menganalisis dokumen anggaran, dan menghasilkan laporan resmi secara efisien.

Dibangun untuk **Microsoft Elevate Hackathon** — didukung oleh Microsoft Azure dan Google Gemini AI.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Dashboard** | Ringkasan statistik temuan risiko, distribusi per level dan jenis dokumen |
| **Manajemen Dokumen** | Upload dokumen anggaran (APBD, SPJ, Pengadaan) dalam format CSV untuk dianalisis AI |
| **Temuan Risiko** | Daftar temuan yang dideteksi AI, lengkap dengan konfirmasi dan detail analisis |
| **Konsultasi AI** | Chat dengan AI untuk pertanyaan seputar regulasi keuangan daerah |
| **Laporan** | Generate memo audit resmi (DOCX/PDF) dari temuan yang sudah dikonfirmasi |

---

## Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org) (App Router) + TypeScript
- **UI**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Auth & Database**: [Supabase](https://supabase.com)
- **Backend API**: FastAPI (Python) — repo terpisah
- **AI**: Google Gemini 2.5 Flash Lite via backend
- **Deploy**: [Vercel](https://vercel.com)

---

## Struktur Direktori

```
frontend/
├── app/
│   ├── (app)/                  # Route group — halaman yang butuh auth
│   │   ├── dashboard/          # Halaman dashboard
│   │   ├── documents/          # Manajemen dokumen
│   │   ├── findings/           # Temuan risiko + detail
│   │   ├── chat/               # Konsultasi AI
│   │   ├── laporan/            # Generate laporan
│   │   └── layout.tsx          # Layout dengan sidebar + auth guard
│   ├── login/                  # Halaman login
│   └── layout.tsx              # Root layout
├── components/
│   ├── ui/                     # Komponen shadcn/ui
│   ├── Sidebar.tsx             # Navigasi sidebar
│   └── RiskBadge.tsx           # Badge level risiko
├── lib/
│   ├── api.ts                  # API client (semua endpoint backend)
│   ├── supabase.ts             # Supabase client
│   └── types.ts                # TypeScript types
└── public/
```

---

## Memulai (Development)

### Prasyarat

- Node.js 18+
- npm / yarn / pnpm
- Backend PANTAU sudah berjalan (lihat repo backend)

### Instalasi

```bash
# Clone repo
git clone https://github.com/<your-username>/pantau-frontend.git
cd pantau-frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan nilai yang sesuai
```

### Environment Variables

Buat file `.env.local` berdasarkan `.env.example`:

```env
# Supabase (public keys)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# URL backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repo GitHub ini
3. Framework preset akan terdeteksi otomatis sebagai **Next.js**
4. Tambahkan environment variables berikut:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase |
| `NEXT_PUBLIC_API_URL` | URL backend yang sudah live |

5. Klik **Deploy**

Setiap push ke branch `main` akan otomatis trigger redeploy.

---

## Akun Demo

Untuk mencoba aplikasi tanpa registrasi, gunakan tombol **"Masuk sebagai demo"** di halaman login.

> Akun demo memiliki akses read ke data sample yang sudah tersedia.

---

## Screenshot

> Dashboard, Temuan Risiko, dan Konsultasi AI tersedia setelah login.

---

## Lisensi

Proyek ini dibuat untuk keperluan kompetisi Microsoft Elevate Hackathon.
