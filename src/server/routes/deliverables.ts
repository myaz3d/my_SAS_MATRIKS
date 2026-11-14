import { Router } from 'express';
import prisma from '../db';
import * as XLSX from 'xlsx';
import { DEFAULT_SBPPA_MAPPING, SBPPAColumnMapping } from '../../shared/types';
import { validateScore, getMasteryLabel } from '../../shared/validation';

const router = Router();

// 1. Export Readiness Checklist
router.get('/readiness-checklist', async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const totalStudents = await prisma.student.count({ where: { active: true } });
    const records = await prisma.scoreRecord.findMany({
      where: { cycleId: String(cycleId) },
      include: { student: true, subject: true, class: true },
    });

    const totalEntered = records.filter(r => r.rawScore !== null).length;
    const totalInvalid = records.filter(r => {
      if (r.rawScore === null) return false;
      const v = validateScore(r.rawScore);
      return !v.isValid;
    }).length;

    const totalSampled = records.filter(r => r.isSampled).length;
    const samplePercentage = records.length > 0 ? (totalSampled / records.length) * 100 : 0;

    // Analyze quorum per subject
    const subjectQuorumMap: Record<string, { code: string; name: string; total: number; sampled: number; percentage: number; isMet: boolean }> = {};
    for (const r of records) {
      const code = r.subject.code;
      if (!subjectQuorumMap[code]) {
        subjectQuorumMap[code] = {
          code,
          name: r.subject.name,
          total: 0,
          sampled: 0,
          percentage: 0,
          isMet: false,
        };
      }
      subjectQuorumMap[code].total++;
      if (r.isSampled) subjectQuorumMap[code].sampled++;
    }
    const subjectQuorums = Object.values(subjectQuorumMap).map(s => {
      s.percentage = s.total > 0 ? (s.sampled / s.total) * 100 : 0;
      s.isMet = s.percentage >= 10.0;
      return s;
    });
    const unmetSubjects = subjectQuorums.filter(s => !s.isMet);

    const totalApproved = records.filter(r => ['APPROVED', 'EXPORT_READY', 'LOCKED'].includes(r.status)).length;
    const totalPendingCorrection = records.filter(r => r.status === 'DRAFT' && r.correctionReason?.includes('Maklum Balas Moderasi')).length;

    const checklist = [
      {
        id: 'CH01',
        title: 'Kelengkapan Kemasukan Markah',
        description: 'Semua murid yang berdaftar mesti mempunyai skor mentah berangka.',
        passed: totalEntered > 0 && records.filter(r => r.rawScore === null).length === 0,
        currentValue: `${totalEntered} / ${records.length} rekod berangka diisi`,
        severity: 'CRITICAL',
      },
      {
        id: 'CH02',
        title: 'Integriti & Julat Skor Mentah',
        description: 'Tiada markah di luar julat sah 0 - 100 atau aksara bukan angka.',
        passed: totalInvalid === 0,
        currentValue: totalInvalid === 0 ? 'Semua skor dalam julat sah (0 - 100)' : `${totalInvalid} ralat julat ditemui`,
        severity: 'CRITICAL',
      },
      {
        id: 'CH03',
        title: 'Kuorum Moderasi KPMP (Minimum 10%)',
        description: 'Ketua Panitia mesti menyemak dan memoderasi sekurang-kurangnya 10% sampel rawak rekod yang dihantar.',
        passed: samplePercentage >= 10.0 && unmetSubjects.length === 0,
        currentValue: `${samplePercentage.toFixed(1)}% sampel dimoderasi (${totalSampled}/${records.length} rekod)${unmetSubjects.length > 0 ? ` • Perlu sampel: ${unmetSubjects.map(u => `${u.code} (${u.percentage.toFixed(0)}%)`).join(', ')}` : ''}`,
        severity: 'CRITICAL',
        unmetSubjects,
        subjectQuorums,
      },
      {
        id: 'CH04',
        title: 'Penyelesaian Isu & Maklum Balas Moderasi',
        description: 'Tiada rekod tertangguh atau belum dibetulkan selepas teguran KPMP.',
        passed: totalPendingCorrection === 0,
        currentValue: totalPendingCorrection === 0 ? 'Semua teguran telah diselesaikan' : `${totalPendingCorrection} rekod perlu pembetulan`,
        severity: 'WARNING',
      },
      {
        id: 'CH05',
        title: 'Kelulusan Rasmi Pentadbir / Guru Besar',
        description: 'Rekod telah diluluskan oleh Guru Besar / Penyelaras sebelum pakej penyediaan dijana.',
        passed: totalApproved > 0 && totalApproved === records.length,
        currentValue: `${totalApproved} / ${records.length} rekod telah diluluskan`,
        severity: 'CRITICAL',
      },
      {
        id: 'CH06',
        title: 'Pengesahan Pematuhan Integriti SBPPA KPM',
        description: 'Pengesahan bahawa fail eksport adalah pakej penyediaan bagi kemasukan/muat naik rasmi manual berkanun ke SBPPA.',
        passed: true,
        currentValue: 'Pakej bertanda integriti SBPPA sedia dijanakan',
        severity: 'INFO',
      },
    ];

    const isAllReady = checklist.filter(c => c.severity === 'CRITICAL').every(c => c.passed);

    res.json({
      cycleId,
      isAllReady,
      checklist,
      summary: {
        totalStudents,
        totalRecords: records.length,
        totalEntered,
        totalSampled,
        samplePercentage: samplePercentage.toFixed(1),
        totalApproved,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Generate SBPPA Import Preparation Package (CSV or XLSX)
router.post('/sbppa-export', async (req, res) => {
  try {
    const { cycleId, format = 'xlsx', columnMapping = DEFAULT_SBPPA_MAPPING, userId, userName, userRole } = req.body;

    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const school = await prisma.school.findFirst();
    const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId } });

    const records = await prisma.scoreRecord.findMany({
      where: { cycleId },
      include: {
        student: true,
        class: true,
        subject: true,
      },
      orderBy: [
        { class: { name: 'asc' } },
        { student: { fullName: 'asc' } },
        { subject: { code: 'asc' } },
      ],
    });

    const mapping = { ...DEFAULT_SBPPA_MAPPING, ...columnMapping };

    const exportRows = records.map(r => ({
      [mapping.schoolCode]: school?.code || 'XCA4301',
      [mapping.mykid]: r.student.mykid,
      [mapping.studentName]: r.student.fullName,
      [mapping.gradeLevel]: r.class.gradeLevel,
      [mapping.className]: r.class.name,
      [mapping.subjectCode]: r.subject.code,
      [mapping.rawScore]: r.rawScore !== null ? r.rawScore : '',
      [mapping.masteryLevel]: r.masteryLevel ? `TP${r.masteryLevel}` : '',
      [mapping.assessmentDate]: r.submittedAt ? r.submittedAt.toISOString().split('T')[0] : '2026-05-20',
      [mapping.verificationStatus]: r.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SBPPA_IMPORT_DATA');

    // Add Metadata sheet highlighting official notice
    const metaData = [
      { Parameter: 'KETERANGAN DOKUMEN', Nilai: 'PAKEJ PENYEDIAAN REKOD MATRIKS PEMBELAJARAN UNTUK SBPPA KPM' },
      { Parameter: 'NOTIS INTEGRITI', Nilai: 'Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM. Fail ini dijana sebagai bahan penyediaan/muat naik manual berkanun oleh pihak sekolah.' },
      { Parameter: 'KOD SEKOLAH', Nilai: school?.code || 'XCA4301' },
      { Parameter: 'NAMA SEKOLAH', Nilai: school?.name || 'Sekolah Agama Suria' },
      { Parameter: 'PPD / NEGERI', Nilai: `${school?.ppd || 'PPD Tuaran'}, ${school?.state || 'Sabah'}` },
      { Parameter: 'ALAMAT', Nilai: 'Kg Tajau Jalan Serusup, 89208 Tuaran, Sabah' },
      { Parameter: 'KITARAN PENTAKSIRAN', Nilai: cycle?.name || 'Kitaran 1 - 2026/2027' },
      { Parameter: 'TARIKH JANAAN', Nilai: new Date().toISOString() },
      { Parameter: 'DIJANA OLEH', Nilai: `${userName || 'Pegawai Data'} (${userRole || 'DATA_OFFICER'})` },
      { Parameter: 'JUMLAH REKOD', Nilai: records.length.toString() },
    ];
    const metaSheet = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'NOTA_INTEGRITI');

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Pegawai Data',
        userRole: userRole || 'DATA_OFFICER',
        action: 'EXPORT_SBPPA_PACKAGE',
        entityType: 'EXPORT',
        entityId: cycleId,
        details: JSON.stringify({
          format,
          recordCount: records.length,
          schoolCode: school?.code || 'XCA4301',
          columns: Object.values(mapping),
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      res.setHeader('Content-Disposition', `attachment; filename="Pakej_SBPPA_Penyediaan_${school?.code || 'XCA4301'}_${Date.now()}.csv"`);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.send(csv);
    } else {
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', `attachment; filename="Pakej_SBPPA_Penyediaan_${school?.code || 'XCA4301'}_${Date.now()}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Data Validation Report
router.get('/validation-report', async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const records = await prisma.scoreRecord.findMany({
      where: { cycleId: String(cycleId) },
      include: { student: true, class: true, subject: true },
    });

    const errors: any[] = [];
    const warnings: any[] = [];
    const validRecords: any[] = [];

    records.forEach(r => {
      const v = validateScore(r.rawScore);
      const rowInfo = {
        recordId: r.id,
        mykid: r.student.mykid,
        studentName: r.student.fullName,
        className: r.class.name,
        subjectCode: r.subject.code,
        subjectName: r.subject.name,
        rawScore: r.rawScore,
        masteryLevel: r.masteryLevel,
        status: r.status,
      };

      if (!v.isValid) {
        errors.push({
          ...rowInfo,
          errorList: v.errors,
        });
      } else if (v.warnings.length > 0) {
        warnings.push({
          ...rowInfo,
          warningList: v.warnings,
        });
      } else {
        validRecords.push(rowInfo);
      }
    });

    res.json({
      cycleId,
      totalRecords: records.length,
      validCount: validRecords.length,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
      integrityRate: records.length > 0 ? (((validRecords.length + warnings.length) / records.length) * 100).toFixed(1) : '100.0',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Reconciliation Report
router.get('/reconciliation-report', async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { students: true } },
      },
    });

    const subjects = await prisma.subject.findMany();
    const records = await prisma.scoreRecord.findMany({
      where: { cycleId: String(cycleId) },
      include: { class: true, subject: true },
    });

    const reconciliationRows = classes.map(cls => {
      const classRecords = records.filter(r => r.classId === cls.id);
      const expectedTotal = cls._count.students * subjects.length;
      const enteredCount = classRecords.filter(r => r.rawScore !== null).length;
      const submittedCount = classRecords.filter(r => r.status !== 'DRAFT').length;
      const approvedCount = classRecords.filter(r => ['APPROVED', 'EXPORT_READY', 'LOCKED'].includes(r.status)).length;
      const pendingCount = expectedTotal - approvedCount;

      return {
        classId: cls.id,
        className: cls.name,
        studentCount: cls._count.students,
        expectedRecords: expectedTotal,
        enteredCount,
        submittedCount,
        approvedCount,
        pendingCount,
        completionRate: expectedTotal > 0 ? ((approvedCount / expectedTotal) * 100).toFixed(1) : '0.0',
      };
    });

    res.json({
      cycleId,
      totalClasses: classes.length,
      totalSubjects: subjects.length,
      totalStudentsEnrolled: classes.reduce((sum, c) => sum + c._count.students, 0),
      grandExpectedRecords: reconciliationRows.reduce((sum, r) => sum + r.expectedRecords, 0),
      grandEnteredRecords: reconciliationRows.reduce((sum, r) => sum + r.enteredCount, 0),
      grandApprovedRecords: reconciliationRows.reduce((sum, r) => sum + r.approvedCount, 0),
      reconciliationRows,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Moderation Report
router.get('/moderation-report', async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const moderationRecords = await prisma.moderationRecord.findMany({
      where: {
        scoreRecord: { cycleId: String(cycleId) },
      },
      include: {
        moderator: true,
        scoreRecord: {
          include: {
            student: true,
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { moderatedAt: 'desc' },
    });

    const totalInCycle = await prisma.scoreRecord.count({ where: { cycleId: String(cycleId) } });
    const sampleRate = totalInCycle > 0 ? ((moderationRecords.length / totalInCycle) * 100).toFixed(1) : '0.0';

    res.json({
      cycleId,
      totalScores: totalInCycle,
      sampledCount: moderationRecords.length,
      sampleRate,
      meets10PercentRequirement: Number(sampleRate) >= 10.0,
      records: moderationRecords.map(m => ({
        id: m.id,
        studentName: m.scoreRecord.student.fullName,
        mykid: m.scoreRecord.student.mykid,
        className: m.scoreRecord.class.name,
        subjectCode: m.scoreRecord.subject.code,
        subjectName: m.scoreRecord.subject.name,
        originalScore: m.originalScore,
        moderatedScore: m.moderatedScore,
        decision: m.decision,
        comments: m.comments,
        moderatorName: m.moderator.name,
        moderatedAt: m.moderatedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Intervention Report
router.get('/intervention-report', async (req, res) => {
  try {
    const { cycleId } = req.query;
    if (!cycleId) return res.status(400).json({ error: 'cycleId is required' });

    const records = await prisma.scoreRecord.findMany({
      where: {
        cycleId: String(cycleId),
        rawScore: { not: null },
      },
      include: {
        student: true,
        class: true,
        subject: true,
      },
      orderBy: [
        { rawScore: 'asc' },
        { class: { name: 'asc' } },
      ],
    });

    const atRiskRecords = records
      .filter(r => r.rawScore !== null && (r.rawScore < 40 || (r.masteryLevel !== null && r.masteryLevel < 3)))
      .map(r => ({
        recordId: r.id,
        studentId: r.student.id,
        studentName: r.student.fullName,
        mykid: r.student.mykid,
        gender: r.student.gender,
        className: r.class.name,
        subjectCode: r.subject.code,
        subjectName: r.subject.name,
        rawScore: r.rawScore,
        masteryLevel: r.masteryLevel,
        masteryLabel: getMasteryLabel(r.masteryLevel),
        suggestedIntervention: r.rawScore! < 20 
          ? 'Bimbingan 1-ke-1 Berfokus (Tahap Asas 3M)' 
          : 'Modul Pemulihan & Pengukuhan Berjadual Panitia',
      }));

    res.json({
      cycleId,
      totalAssessed: records.length,
      interventionCount: atRiskRecords.length,
      interventionRate: records.length > 0 ? ((atRiskRecords.length / records.length) * 100).toFixed(1) : '0.0',
      students: atRiskRecords,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
