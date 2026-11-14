# Matriks Peranan & Kebenaran Pengguna (Role & Permission Matrix)
## Sistem Pengurusan Matriks Pembelajaran (SBPPA-MP)

Aplikasi ini menggunakan model Kawalan Akses Berasaskan Peranan (Role-Based Access Control - RBAC) yang ketat bagi memenuhi prinsip tadbir urus dan garis panduan Kementerian Pendidikan Malaysia (KPM).

---

### 1. Peranan Pengguna & Skop Tanggungjawab

| Kod Peranan | Nama Peranan | Gelaran Tipikal Sekolah | Tanggungjawab Utama |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Pentadbir Sekolah | Guru Besar / PK Pentadbiran | Konfigurasi sistem penuh, kelulusan akhir, buka kunci rekod, pengurusan akaun, keselamatan & sandaran. |
| **`COORDINATOR`** | Penyelaras MP | Guru Kanan / Penyelaras Matriks Pembelajaran | Penyediaan kitaran pentaksiran, penugasan guru, semakan kelengkapan markah, validasi pra-moderasi, kelulusan eksport. |
| **`TEACHER`** | Guru Mata Pelajaran | Guru Mata Pelajaran Kelas | Memasukkan skor mentah bagi murid yang ditugaskan sahaja, menyimpan draf, membuat penyerahan rasmi, meminda skor dengan justifikasi. |
| **`KPMP`** | Ketua Panitia (KPMP) | Ketua Panitia Mata Pelajaran | Menjana sampel rawak sekurang-kurangnya 10%, memoderasi instrumen & evidens, meluluskan atau menolak rekod dengan catatan. |
| **`LEADER`** | Pihak Pengurusan (SLT) | Guru Besar / PK HEM / PK Kokurikulum | Memantau papan pemuka, melihat taburan penguasaan murid, meneliti laporan intervensi murid berisiko, meluluskan rekod (read/approve only). |
| **`DATA_OFFICER`** | Pegawai / Guru Data | Guru Data Sekolah | Mengimport enrolmen murid (CSV/XLSX), menyemak integriti MyKid, menjana fail pakej penyediaan SBPPA rasmi. |

---

### 2. Matriks Kebenaran Fungsi (Function Permission Matrix)

| Modul / Tindakan | `SUPER_ADMIN` | `COORDINATOR` | `TEACHER` | `KPMP` | `LEADER` | `DATA_OFFICER` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Lihat Papan Pemuka Sekolah** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Kemasukan Skor Mentah (Kelas Ditugaskan)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Kemasukan Skor (Mana-mana Kelas)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Simpan Draf Markah** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Hantar Markah (Draf → Dihantar)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Pengesahan Format (Dihantar → Disemak)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Jana Sampel Rawak Panitia (≥ 10%)** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Buat Keputusan Moderasi (Lulus/Tolak/Baiki)** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Kelulusan Pentadbir (Disemak/Mod → Diluluskan)** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Kunci Rekod (Locked)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Kelulusan Buka Kunci Rekod (Unlock)** | ✅ | ✅ (Dengan Alasan) | ❌ | ❌ | ❌ | ❌ |
| **Import Roster Murid (CSV/XLSX)** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Jana Pakej SBPPA (CSV/XLSX)** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Konfigurasi Pemetaan Lajur SBPPA** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Pengurusan ID Pengguna & Kata Laluan** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Lihat & Eksport Log Audit Kekal** | ✅ | ✅ | ❌ | ✅ (Terhad) | ✅ | ✅ |
| **Ubah Konfigurasi Integrasi Rasmi API** | ✅ (Khas) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Muat Turun Sandaran Sistem (Backup JSON)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 3. Matriks Peralihan Status Aliran Kerja (Workflow Transitions)

```
[DRAFT]  ---> Guru memasukkan skor mentah (Autosave/Draft)
   |
   v (Tindakan: Hantar Markah - Guru Mata Pelajaran)
[SUBMITTED] ---> Menunggu semakan kelengkapan oleh Penyelaras MP
   |
   v (Tindakan: Sahkan Format - Penyelaras MP)
[VALIDATED] ---> Skor lengkap, tiada markah tertinggal/ralat julat
   |
   v (Tindakan: Moderasi Sampel Rawak ≥ 10% - Ketua Panitia KPMP)
[MODERATED] ---> Semakan evidens & konsistensi rubrik instrumen
   |
   |---> Jika "NEEDS_CORRECTION" / "REJECTED" : Dikembalikan ke [DRAFT] bersama komen KPMP
   |
   v (Tindakan: Kelulusan Rasmi - Guru Besar / Penyelaras)
[APPROVED]
   |
   v (Tindakan: Penandaan Ketersediaan Eksport - Pegawai Data)
[EXPORT_READY] ---> Sedia untuk penjanaan Pakej Penyediaan SBPPA
   |
   v (Tindakan: Kunci Rekod Pentaksiran)
[LOCKED] ---> Tiada sebarang suntingan dibenarkan tanpa kebenaran Buka Kunci rasmi
```

---

### 4. Pematuhan Privasi Maklumat (PDPA & PII Masking)
- **Paparan No. MyKid**: Demi mematuhi prinsip perlindungan data peribadi murid, sistem menyediakan suis penyamaran (PII Masking) yang menukar 4 digit tengah nombor pengenalan kepada tanda bintang (contoh: `160105-**-**01`).
- **Jejak Audit Penuh**: Setiap kali skor dipinda selepas status Dihantar atau Diluluskan, sistem mewajibkan pengisian **"Justifikasi Pembetulan"** yang direkodkan bersama nama pegawai, tanda masa, nilai skor lama, dan nilai skor baru.
