# my_SAS_MATRIKS — Sistem Pengurusan Matriks Pembelajaran
### Sekolah Agama Suria, Tuaran, Sabah (Kod KPM: XCA4301)
### Aplikasi Sokongan Operasi Dalaman Sekolah & Penyediaan Pakej Pelaporan SBPPA KPM

Aplikasi web bercirikan keselamatan tinggi dan berasaskan peranan (Role-Based Access Control) yang direka khas untuk **Sekolah Agama Suria (SAS)** di Tuaran, Sabah bagi mentadbir aliran kerja instrumen **Matriks Pembelajaran (MP)** serta menyediakan bahan pelaporan berformat rasmi untuk **Sistem Pengurusan Pentaksiran Berpusat (SBPPA)** Kementerian Pendidikan Malaysia (KPM).

---

## 🏛️ Maklumat Rasmi Sekolah (CheckSekolah.my / KPM EMIS)
- **Nama Sekolah**: Sekolah Agama Suria (SAS)
- **Kod Sekolah KPM**: `XCA4301`
- **Jenis / Status**: SR SABK (Sekolah Rendah Agama Bantuan Kerajaan) • Gred B • Pagi Sahaja
- **PPD / Daerah**: PPD Tuaran
- **Negeri**: Sabah
- **Parlimen / DUN**: Parlimen Tuaran • DUN Sulaman
- **Alamat**: Kg Tajau Jalan Serusup, 89208 Tuaran, Sabah
- **No. Telefon**: 088-785525
- **Emel Rasmi KPM**: `xca4301@moe.edu.my`

---

## ⚠️ NOTIS INTEGRITI & PEMATUHAN SBPPA KPM

> **PERINGATAN:** Aplikasi ini adalah **alat sokongan pengurusan dalaman sekolah** bagi memudahkan perekodan skor mentah, pengesahan evidens, dan moderasi panitia. Aplikasi ini **TIDAK menggantikan SBPPA**, tidak melangkauinya, dan **tidak menghantar markah secara terus ke KPM/JPN/PPD** tanpa integrasi rasmi berkanun. Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM.

---

## ✨ Ciri-Ciri Utama Sistem

1. **Pengurusan Enrolmen & Roster Murid (Tahun 4)**:
   - Data demonstrasi realistik: **Sekolah Agama Suria (Kod: XCA4301)**, 3 kelas (4 Cemerlang, 4 Gemilang, 4 Terbilang), 30 murid setiap kelas (**90 murid keseluruhan**).
   - Pengimportan fail CSV/XLSX dengan **Simulasi Validasi Automatik (Dry Run)** bagi mengesan pertindihan MyKid, ralat no. pendaftaran, dan nama kelas tidak wujud.
   - Pematuhan perlindungan privasi data murid (Akta Perlindungan Data Peribadi / PDPA) melalui fungsi **PII Masking**.

2. **Kemasukan Skor Mentah Pantas (Excel-like Spreadsheet Grid)**:
   - Antara muka hamparan elektronik dengan sokongan kekunci navigasi pantas (**Arrow Up/Down, Enter, Tab**).
   - Validasi sempadan skor mentah masa nyata (**0 – 100**, amaran perpuluhan berlebihan, penolakan input bukan angka).
   - Pengiraan automatik **Tahap Penguasaan (TP1 hingga TP6)** berpandukan rubrik rasmi Matriks Pembelajaran KPM.
   - Penandaan automatik bagi murid memerlukan bimbingan intervensi (Skor < 40 atau TP < 3).
   - Penunjuk simpanan draf tempatan dan penyerahan selamat.
   - **Kawalan Pindaan Pasca-Penyerahan**: Sebarang perubahan skor selepas penyerahan mewajibkan catatan **"Justifikasi Pembetulan"** bagi jejak integriti.

3. **Aliran Kerja Penentusahan & Moderasi Sampel KPMP**:
   - Aliran kerja standard 6 peringkat: `DRAFT` ➔ `SUBMITTED` ➔ `VALIDATED` ➔ `MODERATED` ➔ `APPROVED` ➔ `EXPORT_READY` ➔ `LOCKED`.
   - **Penjana Sampel Rawak KPMP**: Memilih sekurang-kurangnya **10% sampel rawak** murid bagi memenuhi kuorum moderasi Ketua Panitia mengikut Panduan Pengurusan MP KPM.
   - Rekod keputusan moderasi panitia: *Diluluskan*, *Perlu Pembetulan*, atau *Ditolak* berserta catatan evidens wajib.
   - Pengembalian automatik rekod yang ditolak kepada guru mata pelajaran.
   - Prosedur **Buka Kunci Rekod (Unlock Request)** dengan justifikasi rasmi pentadbir.

4. **Pakej & Dokumen SBPPA KPM Lengkap**:
   - **Senarai Semak Ketersediaan Eksport (Export Readiness Checklist)**: 6 kriteria kelayakan data yang mesti dipenuhi sebelum fail eksport disahkan bersedia.
   - **Penjanaan Fail Import SBPPA (CSV / XLSX)**: Dilengkapi metadata pengesahan sekolah dan label pakej penyediaan manual berkanun.
   - **Konfigurasi Lajur SBPPA**: Fleksibiliti mengubah pengepala lajur mengikut format terkini SBPPA KPM.
   - **Dokumen Sokongan Pengurusan & Audit**:
     - *Laporan Validasi Integriti Data*
     - *Laporan Penyesuaian Rekod (Reconciliation Report)*
     - *Laporan Moderasi Sampel Rawak KPMP*
     - *Laporan Intervensi Murid Berisiko*

5. **Jejak Audit Kekal (Immutable Audit Trail)**:
   - Merekodkan setiap aktiviti kemasukan skor, pindaan markah, keputusan moderasi, import roster, dan muat turun eksport berserta tanda masa, nama pengguna, peranan, alamat IP, dan butiran JSON perubahan nilai lama vs nilai baru.

6. **Ketersediaan Integrasi Terus SBPPA (Integration Readiness Layer)**:
   - Modul integrasi terus API rasmi dinyahaktifkan secara lalai dengan kawalan keselamatan 4 pra-syarat berkanun (Surat Kuasa KPM, Dokumentasi API, Kredensial Ujian Sandbox, Kelulusan Guru Besar).
   - Simpanan sandaran pangkalan data lengkap (`.json`) bagi tujuan kesinambungan operasi dan pemulihan bencana.

7. **Dwibahasa (Bilingual UI)**:
   - Antara muka lalai dalam Bahasa Malaysia dengan suis pertukaran ke Bahasa Inggeris.

---

## 👥 Peranan Pengguna & Akaun Demo

Sistem dilengkapi penukar peranan pantas (**Role Switcher**) pada bar navigasi atas bagi memudahkan pengujian fungsi:

| Peranan | Nama Pegawai | Emel Log Masuk | Kata Laluan | Tanggungjawab |
| :--- | :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Tn. Haji Roslan Bin Mansor (Guru Besar) | `admin@sekolah.edu.my` | `admin123` | Pentadbir sistem, kelulusan akhir, buka kunci rekod, audit keselamatan. |
| **`COORDINATOR`** | Ustaz Ahmad Fauzi Bin Hassan | `penyelaras@sekolah.edu.my` | `penyelaras123` | Penyelaras MP, pengurusan kitaran, semakan format, kelulusan eksport. |
| **`KPMP` (BM)** | Cikgu Siti Nurhaliza Binti Daud | `kpmp.bm@sekolah.edu.my` | `kpmp123` | Ketua Panitia BM, moderasi sampel rawak 10%, semakan evidens. |
| **`KPMP` (MAT)** | Cikgu Tan Wei Keong | `kpmp.mat@sekolah.edu.my` | `kpmp123` | Ketua Panitia Matematik, moderasi sampel rawak 10%. |
| **`TEACHER`** | Cikgu Aminah Binti Yusof | `guru.bm1@sekolah.edu.my` | `guru123` | Guru BM 4 Cemerlang, kemasukan skor mentah murid ditugaskan. |
| **`TEACHER`** | Cikgu Lim Mei Ling | `guru.mat1@sekolah.edu.my` | `guru123` | Guru Matematik 4 Cemerlang. |
| **`TEACHER`** | Cikgu Rajesh Kumar | `guru.sn1@sekolah.edu.my` | `guru123` | Guru Sains 4 Gemilang. |
| **`LEADER`** | Puan Zuraida Binti Ibrahim (PK Pentadbiran) | `pkp@sekolah.edu.my` | `leader123` | Memantau papan pemuka, analisis pencapaian & intervensi murid. |
| **`DATA_OFFICER`** | En. Faizal Bin Othman (Guru Data) | `data@sekolah.edu.my` | `data123` | Import roster murid, menjana fail pakej penyediaan SBPPA. |

---

## 🛠️ Seni Bina Teknologi (Tech Stack)

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React Icons.
- **Build Tool**: Vite 8.
- **Backend API**: Node.js, Express, TypeScript (tsx).
- **ORM & Pangkalan Data**: Prisma ORM v7 dengan `@prisma/adapter-libsql` & SQLite (`dev.db`).
- **Pustaka Hamparan Data**: SheetJS (`xlsx`) untuk import/eksport CSV & XLSX.
- **Ujian Unit**: Vitest.

---

## 🚀 Panduan Pemasangan & Menjalankan Aplikasi

### 1. Prasyarat
Pastikan komputer anda telah memasang **Node.js** (versi 18 ke atas) dan **npm**.

### 2. Membina & Menjana Data Pangkalan Data
Buka PowerShell atau Terminal dan jalankan arahan berikut di dalam direktori projek:

```powershell
# 1. Masuk ke direktori projek
cd "C:\Users\MY\.gemini\antigravity\scratch\sbppa-matriks-pembelajaran"

# 2. Jana skema Prisma ke pangkalan data SQLite
npx prisma db push

# 3. Jalankan skrip seed data demo sekolah
npm run seed
```

### 3. Menjalankan Ujian Unit (Automated Tests)
Jalankan suite ujian pengesahan skor, matriks kebenaran, peralihan aliran kerja, dan penjana sampel 10%:

```powershell
npm test
```

### 4. Membina Aset Pengeluaran (Production Build)
```powershell
npm run build
```

### 5. Memulakan Aplikasi Web
Jalankan pelayan aplikasi bersepadu:

```powershell
npm start
```
Pelayan akan beroperasi pada alamat: **`http://localhost:3001`** (membekalkan API dan antaramuka web serentak).

Untuk mod pembangunan pantas (Vite HMR):
```powershell
npm run dev
```

---

## 📁 Struktur Direktori Projek

```
sbppa-matriks-pembelajaran/
├── prisma/
│   └── schema.prisma            # Skema pangkalan data Prisma (SQLite)
├── prisma.config.ts             # Konfigurasi Prisma 7 datasource
├── src/
│   ├── client/                  # Antara muka pengguna React + Tailwind
│   │   ├── components/
│   │   │   ├── Dashboard.tsx                   # Papan Pemuka Kemajuan & Analitik
│   │   │   ├── ScoreEntryGrid.tsx              # Grid Hamparan Skor Mentah Guru
│   │   │   ├── ModerationView.tsx              # Pusat Moderasi Sampel KPMP (≥ 10%)
│   │   │   ├── RosterManagement.tsx            # Pengurusan Enrolmen & Import Murid
│   │   │   ├── SBPPAExportPackage.tsx          # Pakej SBPPA & Laporan Rasmi
│   │   │   ├── AuditLogView.tsx                # Log Audit Kekal
│   │   │   ├── OfficialIntegrationSettings.tsx # Tetapan Keselamatan Integrasi API
│   │   │   ├── Navbar.tsx                      # Bar Navigasi & Penukar Peranan
│   │   │   └── OfficialBanner.tsx              # Banner Pematuhan SBPPA KPM
│   │   ├── context/AppContext.tsx              # Keadaan Aplikasi, Pengguna & Sesi
│   │   ├── App.tsx                             # Komponen Induk Aplikasi
│   │   └── main.tsx                            # Titik Masuk Frontend
│   ├── server/                  # Pelayan API RESTful Express
│   │   ├── routes/                             # Laluan API modular
│   │   │   ├── auth.ts                         # Pengesahan & Senarai Pengguna
│   │   │   ├── roster.ts                       # Enrolmen & Import Murid
│   │   │   ├── cycles.ts                       # Kitaran Pentaksiran
│   │   │   ├── scores.ts                       # Grid Skor, Aliran Kerja & Moderasi
│   │   │   ├── deliverables.ts                 # Penjanaan Pakej SBPPA & Laporan
│   │   │   ├── audit.ts                        # Log Audit
│   │   │   └── system.ts                       # Tetapan Sistem & Sandaran
│   │   ├── db.ts                               # Sambungan Prisma LibSQL Client
│   │   ├── seed.ts                             # Skrip Penjana Data Demo Sekolah
│   │   └── index.ts                            # Titik Masuk Pelayan Express
│   ├── shared/                  # Kod Perkongsian Frontend & Backend
│   │   ├── types.ts                            # Definisi Jenis Data & Pemetaan SBPPA
│   │   └── validation.ts                       # Logik Validasi Skor, TP, & Kuorum KPMP
│   └── tests/                   # Suite Ujian Automatik
│       └── unit.test.ts                        # 17 Ujian Unit Komprehensif
├── docs/                        # Dokumentasi Penuh Projek
│   ├── DATABASE_SCHEMA_ERD.md                  # Skema Pangkalan Data & Gambar Rajah ERD
│   ├── ROLE_PERMISSION_MATRIX.md               # Matriks Peranan & Kebenaran Pengguna
│   ├── PANDUAN_PENGGUNA_BM.md                  # Panduan Lengkap Pengguna Bahasa Melayu
│   └── INTEGRATION_SPECIFICATION.md            # Spesifikasi Ketersediaan Integrasi
├── templates/                   # Templat Contoh Fail CSV
│   ├── Templat_Import_Murid_SBPPA.csv          # Templat Import Roster Murid
│   └── Templat_Penyediaan_Eksport_SBPPA.csv     # Templat Eksport Pakej SBPPA
├── package.json                 # Konfigurasi Pakej & Skrip
└── README.md                    # Dokumentasi Utama
```

---

## 📜 Pematuhan & Rujukan Rasmi
- **Buku Panduan Pengurusan Matriks Pembelajaran (KPM)**.
- **Pekeliling Ikhtisas Kementerian Pendidikan Malaysia (KPM)** mengenai pelaksanaan Pentaksiran Berasaskan Sekolah (PBS) dan Pelaporan Berpusat SBPPA.
- **Akta Perlindungan Data Peribadi 2010 (Akta 709)** bagi pengurusan data maklumat peribadi murid.
