# Panduan Pengguna Sistem Pengurusan Matriks Pembelajaran (SBPPA-MP)
## Manual Operasi Sekolah Rendah — Kementerian Pendidikan Malaysia

---

### PERINGATAN INTEGRITI KPM
> **PERHATIAN PENTING:** Aplikasi ini adalah **alat sokongan pengurusan dalaman sekolah** bagi memudahkan guru mentadbir instrumen, merekod skor mentah, menjalankan moderasi panitia, dan menyediakan fail eksport berformat SBPPA. Aplikasi ini **TIDAK menggantikan SBPPA** dan **TIDAK menghantar markah secara automatik/terus** ke pelayan KPM tanpa integrasi rasmi yang diluluskan. Rekod rasmi Matriks Pembelajaran mesti disahkan dan dimuat naik ke SBPPA mengikut prosedur rasmi KPM.

---

### BAHAGIAN 1: PANDUAN GURU MATA PELAJARAN (TEACHER)

#### 1. Prosedur Log Masuk Rasmi & Keselamatan Sesi
1. Akses sistem melalui pelayar web (contoh: Microsoft Edge di `http://localhost:3001`).
2. Masukkan **Alamat Emel Rasmi Pengguna** dan **Kata Laluan** yang telah ditetapkan oleh Pentadbir Sekolah (SUPER_ADMIN).
3. Anda juga boleh memilih salah satu kad **Pilihan Peranan Ujian (Klik untuk Isi Pantas)** bagi memudahkan pengujian peranan simulasi:
   - 👑 **Guru Besar (SUPER_ADMIN)**: `admin@sekolah.edu.my` (Kata laluan: `admin123`)
   - 📋 **Penyelaras MP (COORDINATOR)**: `penyelaras@sekolah.edu.my` (Kata laluan: `penyelaras123`)
   - 🔍 **Ketua Panitia BM (KPMP)**: `kpmp.bm@sekolah.edu.my` (Kata laluan: `kpmp123`)
   - ✏️ **Guru BM (TEACHER)**: `guru.bm1@sekolah.edu.my` (Kata laluan: `guru123`)
   - 📊 **Guru Data (DATA_OFFICER)**: `data@sekolah.edu.my` (Kata laluan: `data123`)
   - 🏛️ **Pihak Pengurusan / PKP (LEADER)**: `pkp@sekolah.edu.my` (Kata laluan: `leader123`)
4. Klik butang **"Log Masuk Sistem"**. Sesi log masuk akan direkodkan ke dalam Jejak Audit bersama alamat IP dan peranan aktif.
5. **Kawalan Akses Peranan (RBAC)**:
   - Sistem akan menyaring tab navigasi secara automatik mengikut peranan anda. Sebagai contoh, Guru Mata Pelajaran (`TEACHER`) hanya dibenarkan mengakses Papan Pemuka, Kemasukan Markah (kelas yang ditugaskan), dan Senarai Murid. Modul ID Pengguna, Log Audit, dan Integrasi Rasmi dikunci dan disorokkan sepenuhnya.
6. **Log Keluar Sesi**:
   - Untuk menamatkan sesi kerja dan memastikan privasi data murid (PDPA), klik butang merah **"Log Keluar"** di sudut kanan atas bar navigasi.

#### 2. Kemasukan Skor Mentah (Grid Hamparan Pantas)
1. Klik tab **"Kemasukan Markah"** pada menu atas.
2. Pilih **Kelas** (contoh: `4 Cemerlang`) dan **Mata Pelajaran** (contoh: `MP01 - Bahasa Melayu`).
3. Sistem akan memaparkan senarai nama murid dan ruang input skor berformat hamparan elektronik.
4. Masukkan skor mentah dalam julat **0 hingga 100**:
   - Sistem akan mengira Tahap Penguasaan (**TP1 hingga TP6**) secara automatik berdasarkan rubrik KPM:
     - **TP6**: 85 – 100 (Cemerlang)
     - **TP5**: 70 – 84 (Sangat Baik)
     - **TP4**: 55 – 69 (Baik)
     - **TP3**: 40 – 54 (Memuaskan - Tahap Minimum KPM)
     - **TP2**: 20 – 39 (Perlu Bimbingan)
     - **TP1**: 0 – 19 (Perlu Bimbingan Rapi)
   - Jika anda memasukkan markah di luar julat (contoh: 120 atau -5), sistem akan memaparkan kotak merah dengan amaran segera.
5. **Navigasi Papan Kekunci**:
   - Gunakan kekunci **Anak Panah Bawah** atau **Enter** untuk berpindah ke baris murid seterusnya dengan pantas.
   - Gunakan kekunci **Anak Panah Atas** untuk kembali ke baris sebelumnya.

#### 3. Menyimpan Draf & Penyerahan Rasmi
1. Anda boleh menekan butang **"Simpan Draf"** pada bila-bila masa. Sistem akan memaparkan penunjuk *"✓ Disimpan dalam draf"*.
2. Setelah semua 30 murid mempunyai markah lengkap tanpa sebarang ralat julat, tekan butang biru **"Hantar Markah"**.
3. Sahkan dialog peringatan. Status rekod akan bertukar daripada **`DRAFT`** kepada **`SUBMITTED`**.

#### 4. Pindaan Markah Selepas Penyerahan (Justifikasi Rasmi)
1. Jika anda perlu membetulkan markah selepas status dihantar atau diluluskan, ubah nilai pada grid.
2. Sistem akan membuka tetingkap **"Justifikasi Pembetulan Markah Diperlukan"**.
3. Nyatakan alasan pembetulan (contoh: *"Semakan semula kertas ujian soalan 4 bahagian penulisan"*).
4. Tekan **"Sahkan & Simpan Pindaan"**. Perubahan akan direkodkan ke dalam Jejak Audit dan sejarah versi murid.

---

### BAHAGIAN 2: PANDUAN KETUA PANITIA MATA PELAJARAN (KPMP)

#### 1. Objektif Moderasi Panitia
Ketua Panitia bertanggungjawab memastikan ketetapan rubrik instrumen pentaksiran dipatuhi secara adil dan konsisten merentasi semua kelas. Mengikut panduan KPM, sekurang-kurangnya **10% sampel rawak** murid daripada rekod yang dihantar wajib disemak.

#### 2. Menjana Sampel Rawak 10%
1. Klik tab **"Semakan & Moderasi"**.
2. Pilih Mata Pelajaran Panitia anda (contoh: `MP01 - Bahasa Melayu`) dan Kelas.
3. Klik butang **"Jana Sampel Rawak (≥ 10%)"**.
4. Sistem akan memilih murid secara rawak berstrata (contoh: 4 daripada 30 murid = 13.3%) dan menandakannya dengan bintang kuning `★ Sampel`.

#### 3. Menjalankan Semakan & Rekod Keputusan
1. Pada senarai murid sampel, klik butang **"Semak"**.
2. Teliti instrumen dan evidens murid, kemudian pilih keputusan:
   - **✓ Diluluskan (Approved)**: Skor guru tepat dan disahkan.
   - **⚠ Perlu Pembetulan (Needs Correction)**: Markah atau evidens perlu disemak semula oleh guru.
   - **✕ Ditolak (Rejected)**: Markah ditolak.
3. Jika terdapat perbezaan skor, masukkan **Skor Moderasi** baharu.
4. Jika memilih *Pembetulan* atau *Tolak*, anda **wajib memasukkan ulasan** sebab penolakan.
5. Tekan **"Simpan Keputusan Moderasi"**. Jika ditolak, rekod tersebut akan dikembalikan secara automatik kepada guru dengan status `DRAFT` berserta ulasan anda.

---

### BAHAGIAN 3: PANDUAN PENYELARAS MATRIKS PEMBELAJARAN (COORDINATOR)

#### 1. Pengurusan Kitaran Pentaksiran
1. Pada bar navigasi atas, pilih kitaran aktif (contoh: `Kitaran 1 - Pertengahan Sesi 2026/2027`).
2. Kitaran boleh berada dalam status:
   - **`DRAFT`**: Kitaran dalam perancangan awal.
   - **`ACTIVE`**: Tingkap pengisian skor mentah sedang dibuka untuk guru.
   - **`CLOSED`**: Pengisian tamat, peringkat semakan dan kelulusan.
   - **`LOCKED`**: Rekod dikunci sepenuhnya sebelum eksport.

#### 2. Memantau Kemajuan di Papan Pemuka
1. Buka tab **"Papan Pemuka"**.
2. Semak saluran status kerja (Pipeline):
   - Pastikan tiada rekod yang tertinggal dalam status `DRAFT`.
   - Pastikan kuorum moderasi KPMP melepasi tahap minimum **10%**.
3. Semak taburan Tahap Penguasaan murid dan kenal pasti murid yang berada di bawah penanda aras minimum KPM (TP1 & TP2 atau skor < 40).

#### 3. Mengunci Rekod & Meluluskan Buka Kunci
1. Setelah semua moderasi panitia selesai, tekan **"Luluskan Semua Rekod"**.
2. Apabila rekod telah berstatus `LOCKED`, sebarang permohonan buka kunci oleh guru memerlukan kelulusan Penyelaras atau Guru Besar dengan justifikasi bertulis dalam modal khas.

---

### BAHAGIAN 4: PANDUAN PEGAWAI / GURU DATA (DATA OFFICER)

#### 1. Import Enrolmen Murid
1. Klik tab **"Pengurusan Murid"**.
2. Anda boleh memuat turun fail templat standard melalui butang **"Templat Import (XLSX)"**.
3. Sediakan fail CSV/XLSX dengan lajur wajib: `NO_PENDAFTARAN`, `NO_MYKID`, `NAMA_PENUH`, `JANTINA`, `NAMA_KELAS`, `TAHUN`.
4. Klik **"Import Roster Murid"** dan pilih fail anda.
5. Sistem akan menjalankan **Simulasi Validasi Automatik (Dry Run)** terlebih dahulu:
   - Mengesan pertindihan No. MyKid.
   - Mengesan no. pendaftaran murid yang berulang.
   - Mengesan nama kelas yang tidak wujud.
6. Jika tiada ralat kritikal, tekan **"Sahkan & Masukkan Data"**.

#### 2. Penjanaan Pakej Penyediaan SBPPA & Senarai Semak Interaktif
1. Buka tab **"Pakej SBPPA"**.
2. Semak **Senarai Semak Ketersediaan Eksport (Export Readiness Checklist)**:
   - `CH01`: Kelengkapan Kemasukan Markah (100% diisi).
   - `CH02`: Integriti & Julat Skor Mentah (Tiada ralat > 100 atau bukan angka).
   - `CH03`: Kuorum Moderasi KPMP (Mencapai ≥ 10% sampel).
   - `CH04`: Tiada maklum balas moderasi tertangguh.
   - `CH05`: Kelulusan rasmi pentadbir sekolah direkodkan.
   - `CH06`: Pengesahan notis pematuhan SBPPA KPM.
3. **Navigasi Pantas Kad Berlatarbelakang Merah (Perlu Tindakan):**
   - Setiap elemen senarai semak yang berlatarbelakang merah/jingga kini **boleh diklik terus**:
     - Klik kad **CH01** atau **CH02** untuk dibawa terus ke modul **Kemasukan Markah**.
     - Klik kad **CH03**, **CH04**, atau **CH05** untuk dibawa terus ke modul **Semakan & Moderasi** bagi menjana sampel, menyelesaikan isu, atau meluluskan rekod.
     - Klik lencana amaran **"TINDAKAN TERTANGGUH DIKESAN"** untuk terus menyelesaikan isu pertama yang belum selesai.
4. Jika perlu menyesuaikan pengepala lajur dengan versi templat SBPPA KPM, klik **"Konfigurasi Lajur SBPPA"**.
5. Tekan **"Muat Turun Fail Excel (.xlsx)"** atau **"CSV"**.
6. Fail yang dimuat turun sedia untuk dimuat naik secara rasmi ke portal SBPPA KPM oleh guru yang diberi kuasa.

#### 3. Mencetak Laporan Sokongan
Pada tab Pakej SBPPA, anda boleh membuka dan mencetak laporan berikut untuk simpanan fail sekolah:
- **Laporan Validasi Integriti Data**
- **Laporan Penyesuaian Rekod (Reconciliation Report)**
- **Laporan Moderasi Sampel Rawak KPMP**
- **Laporan Intervensi Murid Berisiko**

---

### BAHAGIAN 5: PANDUAN PENTADBIR SEKOLAH / GURU BESAR (SUPER_ADMIN)

#### 1. Tadbir Urus & Jejak Audit
1. Buka tab **"Log Audit"**.
2. Semua tindakan guru, kemasukan markah, pertukaran skor, keputusan moderasi, dan tarikh masa muat turun direkodkan secara kekal tanpa boleh dipadam.
3. Anda boleh menapis aktiviti mengikut jenis tindakan atau mengeksport keseluruhan log audit ke fail CSV untuk semakan nazir atau audit JPN.

#### 2. Keselamatan & Dasar Integrasi Terus SBPPA
1. Buka tab **"Integrasi Rasmi"**.
2. Modul integrasi terus API SBPPA kekal **DINYAHAKTIFKAN** secara lalai.
3. Pengaktifan hanya boleh dilakukan apabila pihak sekolah menerima:
   - Surat Kuasa Bertulis Rasmi daripada KPM/JPN/PPD.
   - Spesifikasi Teknikal & Dokumentasi API Rasmi SBPPA.
   - Kredensial Ujian Sandbox.
   - Perakuan kelulusan bertulis Guru Besar.
4. Kredensial disimpan secara disulitkan (encrypted token) dan tidak dipaparkan dalam bentuk teks biasa.

#### 3. Pengurusan ID Pengguna & Kawalan Akses (RBAC)
1. Buka tab **"ID Pengguna"** pada bar navigasi atas.
2. Akaun Guru Besar utama (`Puan Maimunah Binti Tajuddin`) memegang peranan **`SUPER_ADMIN`** dan dilindungi daripada sebarang pemadaman tidak sengaja.
3. **Mendaftar Pengguna Baharu**:
   - Klik butang **"Daftar Pengguna Baharu"**.
   - Masukkan Nama Penuh Pegawai, Alamat Emel Rasmi, Peranan Sistem (`SUPER_ADMIN`, `COORDINATOR`, `KPMP`, `TEACHER`, `LEADER`, `DATA_OFFICER`), dan Kata Laluan Permulaan.
   - Klik **"Daftar Pengguna"**. Akaun baharu akan didaftarkan serta-merta dan direkodkan dalam Jejak Audit.
4. **Mengemas Kini Maklumat Pengguna**:
   - Klik butang ikon pensel (**Kemaskini Maklumat**) pada baris pengguna.
   - Ubah nama, emel, atau peranan pegawai mengikut keperluan penugasan semasa.
5. **Menetapkan Semula Kata Laluan (Password Reset)**:
   - Klik butang ikon kunci (**Set Semula Kata Laluan**).
   - Masukkan kata laluan baharu dan klik **"Sahkan Set Semula"**.
6. **Memadam ID Pengguna**:
   - Klik butang tong sampah (**Padam Pengguna**) dan sahkan tindakan pada dialog amaran.

#### 4. Sandaran Pangkalan Data (Disaster Recovery)
1. Pada tab **"Integrasi Rasmi"**, bahagian bawah membolehkan pentadbir memuat turun fail sandaran penuh pangkalan data (`.json`) pada bila-bila masa untuk disimpan di media sandaran selamat sekolah.
