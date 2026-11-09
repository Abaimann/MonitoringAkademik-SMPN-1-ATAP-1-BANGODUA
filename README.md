# MONIKA — Monitoring Akademik Siswa (SMPN Satu Atap 1 Bangodua)

**Judul Penelitian Skripsi:**
> **RANCANG BANGUN SISTEM MONITORING PERKEMBANGAN SISWA BERBASIS DATA AKADEMIK**
> Studi Kasus: **SMPN Satu Atap 1 Bangodua**

Prototype website interaktif, responsif, dan **Mobile-First** (dioptimalkan untuk layar smartphone 360px–430px dengan adaptasi tablet dan desktop) untuk mendemonstrasikan antarmuka serta alur fungsional sistem monitoring perkembangan akademik siswa.

> **Catatan Metodologis Skripsi:**
> Rencana implementasi sistem penelitian sebenarnya menggunakan **Laravel, PHP, MySQL, dan Blade**. Prototype berbasis React + TypeScript + Vite ini berfungsi sebagai demonstrasi visual dan alur bisnis interaktif yang struktur data serta aturan perhitungannya dirancang agar siap ditranslasikan langsung ke arsitektur MVC Laravel & Blade.

---

## Cara Menjalankan Proyek Secara Lokal

Pastikan **Node.js** (versi 18 atau lebih baru) telah terpasang.

1. **Instalasi dependensi** (jika belum dijalankan):
   ```bash
   npm install
   ```

2. **Menjalankan server pengembangan (Development Server):**
   ```bash
   npm run dev
   ```
   Buka URL yang tampil di terminal (umumnya `http://localhost:5173`) melalui browser laptop atau smartphone (gunakan DevTools Mobile Viewport `390px` seperti iPhone 14/15 atau Android untuk melihat pengalaman utama *Mobile-First*).

3. **Membuat build produksi (Production Build & Type Check):**
   ```bash
   npm run build
   ```

---

## Struktur Folder Proyek

```text
c:\SAVING\SKRIPSI
├── index.html                        # Entry HTML (bahasa Indonesia, font Plus Jakarta Sans)
├── package.json                      # Konfigurasi paket & skrip Vite, React, Tailwind, Recharts
├── vite.config.ts                    # Konfigurasi bundler Vite & plugin Tailwind CSS
├── tsconfig.json                     # Konfigurasi TypeScript
└── src/
    ├── main.tsx                      # Entry point aplikasi React & Provider
    ├── App.tsx                       # Konfigurasi 18 rute halaman & proteksi sesi demo
    ├── index.css                     # Design system tokens (Soft Blue & White light theme)
    ├── types/
    │   └── academic.ts               # Definisi tipe data (Siswa, Guru, Kelas, Nilai, Presensi, Monitoring)
    ├── utils/
    │   └── academicRules.ts          # Mesin perhitungan nilai akhir, presensi, tren antarperiode & rekomendasi
    ├── data/
    │   └── mockData.ts               # Data simulasi terintegrasi (3 kelas, 36 siswa, 8 guru, 7 mapel, 4 semester)
    ├── context/
    │   └── AcademicContext.tsx       # State terpusat dengan persistensi localStorage & fitur Reset Data Demo
    ├── components/
    │   ├── layout/
    │   │   └── AppShell.tsx          # Layout Mobile-First (Bottom Navigation 5 menu) & Sidebar Desktop
    │   └── ui/
    │       └── CommonUI.tsx          # Komponen reusable (BottomSheet, TrendBadge, PageHeader, EmptyState)
    └── pages/
        ├── auth/
        │   └── LoginPage.tsx         # Halaman Login & pemilihan cepat 5 akun pengguna demo
        ├── dashboard/
        │   ├── DashboardPage.tsx     # Pengarah dashboard sesuai role aktif & switcher demo
        │   ├── SuperAdminDashboard.tsx
        │   ├── WaliKelasDashboard.tsx
        │   ├── GuruMapelDashboard.tsx
        │   └── SiswaWaliDashboard.tsx
        ├── profile/
        │   └── ProfilePage.tsx       # Profil pengguna, ganti peran/siswa demo, & Reset Data Demo
        ├── students/
        │   ├── StudentListPage.tsx   # Daftar siswa, pencarian, filter kelas & status perkembangan
        │   └── StudentDetailPage.tsx # Biodata siswa & ringkasan capaian lintas mata pelajaran
        ├── grades/
        │   ├── GradeManagementPage.tsx    # Input/edit nilai Tugas, UTS, UAS & pengaturan bobot (100%)
        │   └── StudentGradeDetailPage.tsx # Rincian komponen nilai per siswa
        ├── attendance/
        │   ├── AttendanceManagementPage.tsx # Input/edit presensi mobile (H/S/I/A) & riwayat sesi
        │   └── AttendanceRecapPage.tsx      # Rekapitulasi kehadiran per periode & persentase
        ├── monitoring/
        │   ├── StudentMonitoringPage.tsx    # FITUR UTAMA: Monitoring perkembangan akademik individual
        │   ├── PeriodAnalysisPage.tsx       # Analisis perbandingan nilai kelas & mapel lintas semester
        │   └── AttentionStudentsPage.tsx    # Daftar siswa yang memerlukan perhatian / evaluasi
        ├── recommendation/
        │   └── ContinuationRecommendationPage.tsx # Informasi pendukung rekomendasi pendidikan SMA/SMK
        └── admin/
            ├── ManageTeachersPage.tsx       # Pengelolaan data guru (Super Admin)
            ├── ManageClassesPage.tsx        # Pengelolaan kelas & wali kelas (Super Admin)
            ├── ManageSubjectsPage.tsx       # Pengelolaan mata pelajaran SMP (Super Admin)
            ├── ManagePeriodsPage.tsx        # Pengelolaan tahun ajaran & semester (Super Admin)
            └── ManageAssignmentsPage.tsx    # Penugasan guru mata pelajaran & kelas (Super Admin)
```

---

## Fitur yang Sudah Dapat Dicoba (Panduan Demonstrasi)

1. **Simulasi 5 Role Pengguna (Tanpa Login Berulang):**
   - Melalui halaman `/login` atau tombol **"Peran Demo"** di bagian kanan atas setiap halaman, Anda dapat langsung berpindah antara:
     - **Super Admin** (`Drs. H. Suparman, M.Pd.`)
     - **Wali Kelas** (`Siti Nurhaliza, S.Pd.` — Wali Kelas IX-A)
     - **Guru Mata Pelajaran** (`Ahmad Fauzi, S.Pd.` — Guru Matematika & IPA)
     - **Siswa** (`Dimas Pratama` — Siswa Kelas IX-A, dapat diganti ke 36 siswa lain)
     - **Wali Murid** (`Hendra Pratama` — Orang Tua dari Dimas Pratama)
2. **Pengelolaan Nilai & Bobot Dinamis (`/nilai`):**
   - Ubah bobot penilaian **Tugas, UTS, dan UAS** (dengan validasi wajib berjumlah tepat 100%).
   - Tambah/ubah komponen nilai Tugas (Tugas 1, Tugas 2, Tugas 3, dst.), UTS, dan UAS pada siswa.
   - Nilai akhir, rata-rata kelas, grafik perkembangan, hingga ringkasan monitoring langsung diperbarui secara otomatis.
   - Guru Mata Pelajaran hanya dapat mengubah nilai mata pelajaran yang diampunya sesuai hak akses.
3. **Pengelolaan & Rekapitulasi Presensi Mobile (`/presensi` & `/presensi/rekap`):**
   - Pilih tanggal, kelas, dan mata pelajaran, lalu ketuk tombol status **H (Hadir), S (Sakit), I (Izin), atau A (Alpa)** pada kartu siswa.
   - Rekapitulasi menghitung persentase kehadiran berdasarkan pertemuan yang tercatat atau menampilkan *"Data belum tersedia"* bila belum ada pertemuan.
4. **Monitoring Perkembangan Akademik Individual (`/monitoring/:studentId`):**
   - Menampilkan grafik garis perkembangan nilai lintas 4 periode semester (`Semester 1` s.d. `Semester 4`) untuk **siswa yang sama dan mata pelajaran yang sama**.
   - Menyajikan tabel perbandingan antarperiode (nilai sebelumnya, nilai sekarang, selisih poin, persentase perubahan, dan klasifikasi *Meningkat*, *Stabil*, atau *Menurun*).
   - Menampilkan grafik batang horizontal analisis mata pelajaran, analisis presensi pendukung, serta narasi dinamis **"Ringkasan Perkembangan Akademik"**.
5. **Identifikasi Siswa yang Memerlukan Perhatian (`/perhatian`):**
   - Menampilkan siswa dengan tren nilai menurun, capaian di bawah ambang pemantauan demonstrasi, tingkat kehadiran `< 85%`, atau data nilai belum lengkap menggunakan label positif **"Memerlukan Perhatian"** dan **"Perlu Evaluasi"**.
6. **Rekomendasi Pendidikan Lanjutan SMA/SMK (`/rekomendasi/:studentId`):**
   - Menyajikan pemetaan kekuatan rumpun akademik siswa serta bahan pertimbangan setara antara jalur **SMA** dan **SMK** (tanpa klaim prediksi mutlak ataupun penyederhanaan nilai tinggi = SMA / nilai rendah = SMK).
7. **Persistensi & Reset Data Demo:**
   - Seluruh perubahan tersimpan di `localStorage` browser dan dapat dikembalikan kapan saja ke kondisi awal melalui tombol **"Reset Data Demo"**.
