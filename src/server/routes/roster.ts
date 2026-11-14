import { Router } from 'express';
import prisma from '../db';
import * as XLSX from 'xlsx';

const router = Router();

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { code: 'asc' },
    });
    res.json(subjects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get students with filter by classId
router.get('/students', async (req, res) => {
  try {
    const { classId } = req.query;
    const where: any = {};
    if (classId && typeof classId === 'string' && classId !== 'ALL') {
      where.classId = classId;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: [{ class: { name: 'asc' } }, { fullName: 'asc' }],
    });
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual student details and full score report
router.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cycleId } = req.query;

    let student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!student) {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { studentId: id },
            { mykid: id },
          ],
        },
        include: {
          class: true,
        },
      });
    }

    if (!student) {
      return res.status(404).json({ error: 'Murid tidak ditemui' });
    }

    const allSubjects = await prisma.subject.findMany({
      orderBy: { code: 'asc' },
    });

    const scoreWhere: any = { studentId: student.id };
    if (cycleId && typeof cycleId === 'string' && cycleId !== 'ALL') {
      scoreWhere.cycleId = cycleId;
    }

    const scoreRecords = await prisma.scoreRecord.findMany({
      where: scoreWhere,
      include: {
        subject: true,
        cycle: true,
        moderations: {
          include: {
            moderator: {
              select: { name: true, role: true },
            },
          },
          orderBy: { moderatedAt: 'desc' },
        },
      },
      orderBy: { subject: { code: 'asc' } },
    });

    const subjectScores = allSubjects.map(sub => {
      const record = scoreRecords.find(r => r.subjectId === sub.id);
      return {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        targetLevel: sub.targetLevel,
        hasRecord: !!record,
        recordId: record?.id || null,
        rawScore: record?.rawScore ?? null,
        masteryLevel: record?.masteryLevel ?? null,
        status: record?.status || 'NOT_ENTERED',
        isSampled: record?.isSampled || false,
        correctionReason: record?.correctionReason || null,
        cycleId: record?.cycleId || null,
        cycleName: record?.cycle?.name || null,
        submittedAt: record?.submittedAt || null,
        submittedBy: record?.submittedBy || null,
        approvedAt: record?.approvedAt || null,
        approvedBy: record?.approvedBy || null,
        moderations: record?.moderations || [],
      };
    });

    const validScores = subjectScores.filter(s => s.rawScore !== null && s.rawScore !== undefined);
    const averageScore = validScores.length > 0 
      ? Number((validScores.reduce((acc, curr) => acc + (curr.rawScore || 0), 0) / validScores.length).toFixed(1))
      : null;

    const tpCounts = {
      TP1: subjectScores.filter(s => s.masteryLevel === 1).length,
      TP2: subjectScores.filter(s => s.masteryLevel === 2).length,
      TP3: subjectScores.filter(s => s.masteryLevel === 3).length,
      TP4: subjectScores.filter(s => s.masteryLevel === 4).length,
      TP5: subjectScores.filter(s => s.masteryLevel === 5).length,
      TP6: subjectScores.filter(s => s.masteryLevel === 6).length,
    };

    const needsIntervention = validScores.some(s => (s.rawScore !== null && s.rawScore < 40) || (s.masteryLevel !== null && s.masteryLevel <= 2));

    res.json({
      student,
      subjectScores,
      stats: {
        totalSubjects: allSubjects.length,
        recordedSubjects: validScores.length,
        averageScore,
        tpCounts,
        needsIntervention,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sample roster template download (CSV or XLSX)
router.get('/template', (req, res) => {
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
  const sampleData = [
    {
      NO_PENDAFTARAN: 'SBS-C01',
      NO_MYKID: '160105-14-1001',
      NAMA_PENUH: 'Adam Harith Bin Razali',
      JANTINA: 'L',
      NAMA_KELAS: '4 Cemerlang',
      TAHUN: 4,
    },
    {
      NO_PENDAFTARAN: 'SBS-C02',
      NO_MYKID: '160212-14-1002',
      NAMA_PENUH: 'Nurul Iman Binti Zaidi',
      JANTINA: 'P',
      NAMA_KELAS: '4 Cemerlang',
      TAHUN: 4,
    },
    {
      NO_PENDAFTARAN: 'SBS-G01',
      NO_MYKID: '160320-14-1003',
      NAMA_PENUH: 'Chong Wei Jun',
      JANTINA: 'L',
      NAMA_KELAS: '4 Gemilang',
      TAHUN: 4,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Templat_Murid');

  if (format === 'xlsx') {
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="Templat_Import_Murid_SBPPA.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } else {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    res.setHeader('Content-Disposition', 'attachment; filename="Templat_Import_Murid_SBPPA.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }
});

// Validate and process roster import
router.post('/import', async (req, res) => {
  try {
    const { rows, userId, userName, userRole, dryRun = false } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Data import kosong atau format tidak sah.' });
    }

    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(400).json({ error: 'Data sekolah tidak dijumpai.' });
    }

    const existingClasses = await prisma.class.findMany({ where: { schoolId: school.id } });
    const classMap = new Map(existingClasses.map(c => [c.name.trim().toLowerCase(), c]));

    const existingStudents = await prisma.student.findMany();
    const existingMykids = new Set(existingStudents.map(s => s.mykid.replace(/[^0-9]/g, '')));
    const existingRegNos = new Set(existingStudents.map(s => s.studentId.trim().toUpperCase()));

    const errors: Array<{ row: number; field: string; message: string }> = [];
    const warnings: Array<{ row: number; field: string; message: string }> = [];
    const validRows: any[] = [];

    const incomingMykids = new Set<string>();
    const incomingRegNos = new Set<string>();

    rows.forEach((row: any, idx: number) => {
      const rowNum = idx + 2; // header is row 1
      const studentId = (row.NO_PENDAFTARAN || row.studentId || '').trim();
      const mykidRaw = (row.NO_MYKID || row.mykid || '').trim();
      const fullName = (row.NAMA_PENUH || row.fullName || row.name || '').trim();
      const gender = (row.JANTINA || row.gender || '').trim().toUpperCase();
      const className = (row.NAMA_KELAS || row.className || row.class || '').trim();

      // Check required fields
      if (!studentId) {
        errors.push({ row: rowNum, field: 'NO_PENDAFTARAN', message: 'Nombor pendaftaran diperlukan.' });
      }
      if (!fullName) {
        errors.push({ row: rowNum, field: 'NAMA_PENUH', message: 'Nama penuh murid diperlukan.' });
      }
      if (!mykidRaw) {
        errors.push({ row: rowNum, field: 'NO_MYKID', message: 'Nombor MyKid diperlukan.' });
      }
      if (!gender || (gender !== 'L' && gender !== 'P')) {
        errors.push({ row: rowNum, field: 'JANTINA', message: 'Jantina mestilah L atau P.' });
      }
      if (!className) {
        errors.push({ row: rowNum, field: 'NAMA_KELAS', message: 'Nama kelas diperlukan.' });
      }

      // Check class exists
      const targetClass = classMap.get(className.toLowerCase());
      if (className && !targetClass) {
        errors.push({ row: rowNum, field: 'NAMA_KELAS', message: `Kelas "${className}" tidak wujud dalam sistem.` });
      }

      // Check MyKid format (e.g. 12 digits)
      const cleanMykid = mykidRaw.replace(/[^0-9]/g, '');
      if (cleanMykid && cleanMykid.length !== 12) {
        warnings.push({ row: rowNum, field: 'NO_MYKID', message: 'Format MyKid bukan 12 digit lazim (contoh: 160105-14-1234).' });
      }

      // Check duplicate MyKid within file
      if (cleanMykid && incomingMykids.has(cleanMykid)) {
        errors.push({ row: rowNum, field: 'NO_MYKID', message: `MyKid ${mykidRaw} bertindih dalam fail import ini.` });
      } else if (cleanMykid) {
        incomingMykids.add(cleanMykid);
      }

      // Check duplicate studentId within file
      const upperRegNo = studentId.toUpperCase();
      if (upperRegNo && incomingRegNos.has(upperRegNo)) {
        errors.push({ row: rowNum, field: 'NO_PENDAFTARAN', message: `No. Pendaftaran ${studentId} bertindih dalam fail ini.` });
      } else if (upperRegNo) {
        incomingRegNos.add(upperRegNo);
      }

      // Check duplicate against DB
      if (cleanMykid && existingMykids.has(cleanMykid)) {
        errors.push({ row: rowNum, field: 'NO_MYKID', message: `MyKid ${mykidRaw} telah sedia wujud dalam pangkalan data sekolah.` });
      }
      if (upperRegNo && existingRegNos.has(upperRegNo)) {
        errors.push({ row: rowNum, field: 'NO_PENDAFTARAN', message: `No. Pendaftaran ${studentId} telah sedia wujud.` });
      }

      if (errors.filter(e => e.row === rowNum).length === 0 && targetClass) {
        validRows.push({
          studentId: upperRegNo,
          mykid: mykidRaw,
          fullName,
          gender,
          classId: targetClass.id,
        });
      }
    });

    if (dryRun || errors.length > 0) {
      return res.json({
        success: errors.length === 0,
        dryRun: true,
        totalSubmitted: rows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
      });
    }

    // Perform database insertion if not dry run
    let insertedCount = 0;
    for (const item of validRows) {
      await prisma.student.create({ data: item });
      insertedCount++;
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Pegawai Data',
        userRole: userRole || 'DATA_OFFICER',
        action: 'ROSTER_IMPORT',
        entityType: 'ROSTER',
        details: JSON.stringify({
          totalImported: insertedCount,
          fileName: req.body.fileName || 'import_murid.csv',
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      success: true,
      dryRun: false,
      insertedCount,
      warningCount: warnings.length,
      warnings,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
