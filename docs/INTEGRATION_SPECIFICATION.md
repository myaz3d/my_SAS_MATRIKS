# Spesifikasi Ketersediaan Integrasi SBPPA (Integration Specification)
## Protokol Keselamatan & Garis Panduan Keterhubungan Sistem SBPPA-MP

Aplikasi ini dibina berasaskan prinsip **Integrity by Design** bagi menyokong pengurusan pentaksiran Matriks Pembelajaran (MP) di peringkat sekolah tanpa melanggar batasan kuasa perundangan pentaksiran pusat Kementerian Pendidikan Malaysia (KPM).

---

### 1. Prinsip & Status Semasa Integrasi

1. **Alat Sokongan Tempatan (Internal Tooling)**:
   Aplikasi ini bertindak sebagai medium pengurusan dalaman sekolah untuk menyusun evidens instrumen, merekod skor mentah, dan memudah cara moderasi Ketua Panitia (KPMP) mengikut Panduan Pengurusan Matriks Pembelajaran KPM.
2. **Ketiadaan API Awam Tanpa Kuasa Bertulis**:
   Sehingga Kementerian Pendidikan Malaysia (KPM) mengeluarkan Antara Muka Pengaturcaraan Aplikasi (API) rasmi berkanun bersama spesifikasi teknikal terbuka dan kebenaran rasmi bertulis kepada pihak sekolah, sebarang integrasi langsung API adalah **dinyahaktifkan secara lalai (disabled by default)**.
3. **Penyediaan Pakej Berkanun (Official Preparation Package)**:
   Semua fail eksport yang dihasilkan oleh aplikasi ini dilabel secara jelas sebagai:
   > *"Pakej Penyediaan SBPPA — untuk muat naik/kemasukan manual yang diberi kuasa (Bukan Penghantaran Terus Rasmi)"*

---

### 2. Lapisan Ketersediaan Integrasi Modular (Modular Integration Layer)

Sistem telah menyediakan lapisan perkhidmatan modular (*Modular Adapter Service Architecture*) yang bersedia untuk dihubungkan kepada gerbang API SBPPA sebaik sahaja kelulusan bertulis dan dokumen teknikal rasmi dibekalkan:

```
[ Lapisan Aplikasi SBPPA-MP ]
            |
            v
[ Lapisan Ketersediaan Integrasi (Integration Readiness Layer) ]
            |
     +------+------+
     |             |
     v             v
[ Mod Manual ]   [ Mod API Rasmi (Dilindungi) ]
 (Sedia Ada)      - Semakan Surat Kuasa Bertulis KPM
                  - Spesifikasi OpenAPI / REST SBPPA
                  - Pengesahan Token OAuth2 / mTLS
                  - Log Audit Transaksi KPM
```

---

### 3. Pra-Syarat Berkanun Pengaktifan Sambungan API SBPPA

Sebelum integrasi terus dibenarkan beroperasi dalam aplikasi, 4 pra-syarat wajib berikut mesti disahkan oleh Pentadbir Sekolah (Guru Besar):

1. **Surat Kuasa Rasmi KPM/JPN**:
   Kebenaran bertulis rasmi yang memperakui aplikasi sekolah ini dibenarkan berkomunikasi dengan pangkalan data SBPPA KPM.
2. **Dokumentasi & Skema API Berkanun**:
   Dokumentasi rasmi yang mengandungi titik akhir (endpoints), skema muatan JSON, format ralat, dan polisi kadar panggilan (rate limiting).
3. **Kredensial Sandbox Ujian**:
   Kunci API (Client ID & Client Secret) dan sijil mTLS bagi persekitaran ujian simulasi sebelum penggunaan pengeluaran.
4. **Perakuan Sah Guru Besar**:
   Tandatangan dan kelulusan bertulis pentadbir sekolah yang direkodkan ke dalam Jejak Audit sistem.

---

### 4. Perlindungan Kredensial & Pematuhan PDPA

- **Tiada Storan Teks Biasa (No Plaintext Storage)**:
  Kredensial API, token rahsia, atau kunci pensijilan disulitkan menggunakan piawaian penyulitan selamat gred industri dan tidak boleh dipaparkan secara teks biasa dalam antara muka pengguna mahupun kod sumber.
- **Tiada Fabrikasi Respons (Zero Mock Falsification)**:
  Sistem dilarang sama sekali daripada memalsukan status "Telah Dihantar ke KPM" atau menjana respons palsu bagi mengelakkan kekeliruan kepada pihak sekolah dan pegawai nazir KPM.
