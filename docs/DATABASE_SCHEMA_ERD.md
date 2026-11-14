# Database Schema & Entity-Relationship Diagram (ERD)
## Sistem Pengurusan Matriks Pembelajaran (SBPPA-MP) Sekolah Rendah

Dokumen ini memperincikan skema pangkalan data hubungan (relational schema) dan gambar rajah ERD bagi aplikasi dalaman sekolah untuk menyokong pengurusan pentaksiran Matriks Pembelajaran (MP) dan penyediaan pakej pelaporan rasmi ke SBPPA Kementerian Pendidikan Malaysia (KPM).

---

### 1. Gambar Rajah ERD (Entity-Relationship Diagram)

```mermaid
erDiagram
    SCHOOL ||--o{ USER : "mempunyai"
    SCHOOL ||--o{ CLASS : "mempunyai"
    SCHOOL ||--o{ ASSESSMENT_CYCLE : "mentadbir"

    USER ||--o{ TEACHER_ASSIGNMENT : "ditugaskan"
    USER ||--o{ AUDIT_LOG : "melakukan"
    USER ||--o{ MODERATION_RECORD : "memoderasi"

    CLASS ||--o{ STUDENT : "mendaftar"
    CLASS ||--o{ TEACHER_ASSIGNMENT : "diajar oleh"
    CLASS ||--o{ SCORE_RECORD : "mengandungi"

    SUBJECT ||--o{ TEACHER_ASSIGNMENT : "diajar dalam"
    SUBJECT ||--o{ SCORE_RECORD : "ditaksir dalam"

    ASSESSMENT_CYCLE ||--o{ SCORE_RECORD : "mengandungi"

    STUDENT ||--o{ SCORE_RECORD : "menerima"

    SCORE_RECORD ||--o{ SCORE_HISTORY : "mempunyai jejak"
    SCORE_RECORD ||--o{ MODERATION_RECORD : "disemak dalam"
```

---

### 2. Spesifikasi Entiti & Medan

#### A. `School` (Profil Sekolah)
Menyimpan profil rasmi sekolah rendah seperti kod sekolah (contoh: `WBA0042`), PPD, dan Negeri.
- `id` (String, PK, CUID)
- `code` (String, Unique) — Kod rasmi KPM (contoh: WBA0042)
- `name` (String) — Nama rasmi sekolah
- `ppd` (String) — Pejabat Pendidikan Daerah
- `state` (String) — Negeri
- `createdAt`, `updatedAt` (DateTime)

#### B. `User` (Akaun Pengguna & Peranan)
Mengurus akaun guru dan pentadbir mengikut Role-Based Access Control (RBAC).
- `id` (String, PK, CUID)
- `email` (String, Unique)
- `passwordHash` (String)
- `name` (String) — Nama penuh pegawai
- `role` (String) — `SUPER_ADMIN`, `COORDINATOR`, `TEACHER`, `KPMP`, `LEADER`, `DATA_OFFICER`
- `schoolId` (String, FK -> School)
- `subjectHeadOf` (String, Nullable) — Kod mata pelajaran jika dilantik sebagai Ketua Panitia (KPMP)

#### C. `Class` (Bilik Darjah)
- `id` (String, PK, CUID)
- `name` (String) — Contoh: `4 Cemerlang`, `4 Gemilang`, `4 Terbilang`
- `gradeLevel` (Int) — Tahun (contoh: `4`)
- `year` (String) — Sesi Akademik (contoh: `2026/2027`)
- `schoolId` (String, FK -> School)
- Unique Constraint: `[schoolId, gradeLevel, name, year]`

#### D. `Subject` (Mata Pelajaran KPM)
- `id` (String, PK, CUID)
- `code` (String, Unique) — Contoh: `MP01` (BM), `MP02` (BI), `MP03` (Matematik), `MP04` (Sains), `MP05` (Sejarah), `MP06` (PI/PM)
- `name` (String)
- `minScore` (Float, default 0)
- `maxScore` (Float, default 100)
- `weight` (Float, default 1.0)

#### E. `Student` (Enrolmen Murid)
- `id` (String, PK, CUID)
- `mykid` (String, Unique) — No. MyKid 12 digit (contoh: `160105-14-1001`)
- `studentId` (String, Unique) — No. Pendaftaran sekolah (contoh: `SBS-C01`)
- `fullName` (String) — Nama mengikut dokumen pengenalan
- `gender` (String) — `L` (Lelaki) atau `P` (Perempuan)
- `classId` (String, FK -> Class)
- `active` (Boolean, default true)

#### F. `AssessmentCycle` (Kitaran Pentaksiran)
- `id` (String, PK, CUID)
- `name` (String) — Contoh: `Kitaran 1 - Pertengahan Sesi 2026/2027`
- `academicYear` (String) — `2026/2027`
- `term` (Int) — `1` atau `2`
- `targetLevel` (Int) — `4`
- `startDate`, `endDate` (DateTime)
- `status` (String) — `DRAFT`, `ACTIVE`, `CLOSED`, `LOCKED`
- `schoolId` (String, FK -> School)

#### G. `TeacherAssignment` (Penugasan Guru)
- `id` (String, PK, CUID)
- `userId` (String, FK -> User)
- `classId` (String, FK -> Class)
- `subjectId` (String, FK -> Subject)
- Unique Constraint: `[userId, classId, subjectId]`

#### H. `ScoreRecord` (Rekod Skor Mentah & Aliran Kerja)
Entiti teras yang menyimpan skor mentah instrumen pentaksiran murid bagi setiap kitaran.
- `id` (String, PK, CUID)
- `studentId` (String, FK -> Student)
- `classId` (String, FK -> Class)
- `subjectId` (String, FK -> Subject)
- `cycleId` (String, FK -> AssessmentCycle)
- `rawScore` (Float, Nullable) — Skor mentah 0 - 100
- `masteryLevel` (Int, Nullable) — Tahap Penguasaan TP1 hingga TP6
- `status` (String) — `DRAFT`, `SUBMITTED`, `VALIDATED`, `MODERATED`, `APPROVED`, `EXPORT_READY`, `LOCKED`
- `correctionReason` (String, Nullable) — Justifikasi wajib jika markah dipinda pasca-penyerahan
- `isSampled` (Boolean, default false) — Penanda sampel rawak KPMP (kuorum ≥ 10%)
- `submittedAt`, `submittedBy` (DateTime / String)
- `approvedAt`, `approvedBy` (DateTime / String)
- `lockedAt`, `lockedBy` (DateTime / String)
- Unique Constraint: `[studentId, subjectId, cycleId]`

#### I. `ScoreHistory` (Kawalan Versi & Jejak Skor Mentah)
Menyimpan setiap pertukaran nilai markah dari draf awal sehingga eksport akhir bagi tujuan ketelusan integriti.
- `id` (String, PK, CUID)
- `scoreRecordId` (String, FK -> ScoreRecord)
- `oldRawScore` (Float, Nullable)
- `newRawScore` (Float, Nullable)
- `oldStatus`, `newStatus` (String, Nullable)
- `reason` (String, Nullable)
- `changedBy` (String)
- `changedAt` (DateTime, default now)

#### J. `ModerationRecord` (Rekod Moderasi Panitia KPMP)
- `id` (String, PK, CUID)
- `scoreRecordId` (String, FK -> ScoreRecord)
- `moderatorId` (String, FK -> User)
- `originalScore` (Float)
- `moderatedScore` (Float, Nullable)
- `decision` (String) — `APPROVED`, `NEEDS_CORRECTION`, `REJECTED`
- `comments` (String, Nullable) — Catatan semakan evidens instrumen
- `moderatedAt` (DateTime, default now)

#### K. `AuditLog` (Log Audit Kekal & Tidak Boleh Dipadam)
- `id` (String, PK, CUID)
- `userId` (String, FK -> User, Nullable)
- `userName` (String)
- `userRole` (String)
- `action` (String) — Contoh: `SCORE_BATCH_SAVE`, `SCORE_SUBMIT`, `SCORE_MODERATE`, `ROSTER_IMPORT`, `EXPORT_SBPPA_PACKAGE`, `SCORE_UNLOCK_APPROVED`
- `entityType` (String) — `SCORE`, `ROSTER`, `CYCLE`, `SYSTEM`, `INTEGRATION`
- `entityId` (String, Nullable)
- `details` (String) — Butiran JSON
- `ipAddress` (String, default `127.0.0.1`)
- `createdAt` (DateTime, default now)

#### L. `SystemSetting` (Konfigurasi Sistem)
- `id` (String, PK, CUID)
- `key` (String, Unique)
- `value` (String)
- `description` (String, Nullable)
