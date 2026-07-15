# PUSTASDA — OBJECTIVES & Progress

> **Pusat Prestasi SMK Telkom Sidoarjo**
> Platform manajemen lomba dan prestasi siswa berbasis Next.js 15

---

## 📋 Objektif Utama

1. ✅ Membangun platform web untuk mengelola lomba dan prestasi siswa SMK Telkom Sidoarjo
2. ✅ Sistem autentikasi role-based (Siswa, Guru, Admin, Web Developer)
3. 🔄 Dashboard per role dengan fitur spesifik masing-masing
4. 🔄 Sistem manajemen kompetisi (posting, eksplor, partisipasi, tim)
5. ⬜ Sistem mentorship guru-siswa
6. ⬜ Rekapitulasi & analisis prestasi (grafik, chart)
7. ⬜ Leaderboard siswa berprestasi
8. ⬜ AI Chatbot terintegrasi
9. ⬜ Panel admin untuk CRUD user, lomba, kategori
10. ⬜ Panel developer untuk pengaturan aplikasi

---

## ✅ Yang Sudah Selesai

### Phase 1: Foundation & Auth
| Komponen | File | Deskripsi |
|----------|------|-----------|
| Project Setup | `package.json` | Next.js 15, React 19, Prisma, NextAuth v5, Recharts |
| Database Schema | `prisma/schema.prisma` | 24 model lengkap: User, StudentProfile, TeacherProfile, Competition, Category, Field, Team, Participation, Mentorship, Badge, Notification, dll |
| Database Seeder | `prisma/seed.ts` | 4 akun default (admin, developer, guru, siswa), 7 kategori, 8 bidang, 5 badge, app settings, 10 sample kompetisi |
| Design System CSS | `src/app/globals.css` | 2231 baris CSS custom — layout, cards, buttons, forms, timeline, leaderboard, chatbot, responsive |
| Auth Config | `src/lib/auth.ts` | NextAuth v5 Credentials provider, role-based JWT session, activity logging |
| Prisma Client | `src/lib/prisma.ts` | Singleton pattern untuk Prisma Client |
| Middleware | `src/middleware.ts` | Route protection berdasarkan session cookie |
| Login Page | `src/app/(auth)/login/page.tsx` | Split-panel design (gradient kiri + form kanan), no register link |
| NextAuth Route | `src/app/api/auth/[...nextauth]/route.ts` | Handler GET/POST |

### Phase 2: Layouts & Student Beranda
| Komponen | File | Deskripsi |
|----------|------|-----------|
| Navbar | `src/components/layouts/Navbar.tsx` | Navbar atas dengan bell notification, user dropdown, signout |
| Sidebar | `src/components/layouts/Sidebar.tsx` | Sidebar dinamis per role (student, teacher, admin, developer), dropdown pengaturan |
| DashboardLayout | `src/components/layouts/DashboardLayout.tsx` | Wrapper layout sidebar + navbar + main content |
| Student Beranda | `src/app/(dashboard)/student/page.tsx` | Server component: fetch stats, competitions, leaderboard dari DB |
| Student Beranda Client | `src/components/features/StudentBerandaClient.tsx` | Welcome banner merah, 4 kategori card, search, comp grid 10/page, pagination, leaderboard preview, footer |
| Dashboard Redirect | `src/app/(dashboard)/dashboard/page.tsx` | Auto-redirect per role |
| Root Redirect | `src/app/page.tsx` | Redirect ke role dashboard atau login |
| CompCard | `src/components/ui/CompCard.tsx` | Card kompetisi dengan poster, kategori badge, level, deadline |
| StatCard | `src/components/ui/StatCard.tsx` | Card statistik dengan icon dan angka |
| Modal | `src/components/ui/Modal.tsx` | Modal overlay reusable |
| Toast | `src/components/ui/Toast.tsx` | Toast notification system |
| ChatbotFAB | `src/components/ui/ChatbotFAB.tsx` | Floating chatbot button (merah, bawah kanan) — shell UI |

---

## 🔄 Sedang Dikerjakan

### Batch 1: Competition API + Student Explore
- Competition API routes (list, search, filter, detail)
- Student Explore page (search bar, filter chips, dropdown filters, 2-column detail panel)
- Ikuti lomba flow (solo vs team)

---

## ⬜ Belum Dikerjakan

### Batch 2: Participations + Team + Mentorship
- Participation API routes
- Team API routes (create, join via invite code)
- Lomba Saya page
- Detail Partisipasi (timeline kegiatan, mentorship request, submit/selesai)

### Batch 3: Student Settings + Rekapitulasi + Leaderboard
- Settings: Profil edit, Kuis Karakter AI, Preferensi tema
- Rekapitulasi: 4 stat cards, AI summary, grafik 12 bulan, distribusi kategori
- Leaderboard: position highlight, tabel ranking

### Batch 4: Teacher Features
- Teacher Dashboard, Eksplor (share link), Bimbingan, Kotak Masuk, Cari Siswa

### Batch 5: Admin Panel
- Dashboard (charts, stats), User CRUD + bulk import, Competition CRUD, Kategori & Bidang, Monitoring

### Batch 6: Developer Panel
- System Stats, App Settings (icon, warna), Bug Analysis + AI

### Batch 7: Chatbot + Polish
- Full functioning chatbot FAB, responsive polish, micro-animations

---

## 🗄️ Informasi Database

**Engine:** SQLite via Prisma ORM
**Total Model:** 24
**Akun Default:**
- Admin: admin@pustasda.com / admin123
- Developer: dev@pustasda.com / dev123
- Guru: guru@pustasda.com / guru123
- Siswa: siswa@pustasda.com / siswa123

---

## 🛠️ Cara Menjalankan

```bash
cd pustasda
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Buka http://localhost:3000 → redirect ke /login
