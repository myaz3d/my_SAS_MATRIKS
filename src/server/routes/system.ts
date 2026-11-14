import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Get system summary statistics for dashboard
router.get('/stats', async (req, res) => {
  try {
    const { cycleId } = req.query;

    const totalStudents = await prisma.student.count({ where: { active: true } });
    const totalClasses = await prisma.class.count();
    const totalSubjects = await prisma.subject.count();

    const cycleWhere: any = {};
    if (cycleId && typeof cycleId === 'string' && cycleId !== 'ALL') {
      cycleWhere.cycleId = cycleId;
    }

    const records = await prisma.scoreRecord.findMany({
      where: cycleWhere,
      include: {
        subject: true,
        class: true,
      },
    });

    const statusCounts = {
      DRAFT: records.filter(r => r.status === 'DRAFT').length,
      SUBMITTED: records.filter(r => r.status === 'SUBMITTED').length,
      VALIDATED: records.filter(r => r.status === 'VALIDATED').length,
      MODERATED: records.filter(r => r.status === 'MODERATED').length,
      APPROVED: records.filter(r => r.status === 'APPROVED').length,
      EXPORT_READY: records.filter(r => r.status === 'EXPORT_READY').length,
      LOCKED: records.filter(r => r.status === 'LOCKED').length,
    };

    const enteredCount = records.filter(r => r.rawScore !== null).length;
    const sampledCount = records.filter(r => r.isSampled).length;
    const interventionCount = records.filter(r => r.rawScore !== null && (r.rawScore < 40 || (r.masteryLevel !== null && r.masteryLevel < 3))).length;

    // Distribution by TP
    const tpDistribution = {
      TP6: records.filter(r => r.masteryLevel === 6).length,
      TP5: records.filter(r => r.masteryLevel === 5).length,
      TP4: records.filter(r => r.masteryLevel === 4).length,
      TP3: records.filter(r => r.masteryLevel === 3).length,
      TP2: records.filter(r => r.masteryLevel === 2).length,
      TP1: records.filter(r => r.masteryLevel === 1).length,
    };

    // Subject averages
    const subjectStats: Record<string, { name: string; avg: number; count: number }> = {};
    records.forEach(r => {
      if (r.rawScore !== null) {
        if (!subjectStats[r.subject.code]) {
          subjectStats[r.subject.code] = { name: r.subject.name, avg: 0, count: 0 };
        }
        subjectStats[r.subject.code].avg += r.rawScore;
        subjectStats[r.subject.code].count += 1;
      }
    });

    Object.keys(subjectStats).forEach(k => {
      subjectStats[k].avg = Number((subjectStats[k].avg / subjectStats[k].count).toFixed(1));
    });

    res.json({
      totalStudents,
      totalClasses,
      totalSubjects,
      totalRecords: records.length,
      enteredCount,
      completionRate: records.length > 0 ? ((statusCounts.APPROVED + statusCounts.EXPORT_READY + statusCounts.LOCKED) / records.length * 100).toFixed(1) : '0.0',
      statusCounts,
      sampledCount,
      interventionCount,
      tpDistribution,
      subjectStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending workflow users and their outstanding tasks
router.get('/pending-workflow-users', async (req, res) => {
  try {
    const { cycleId } = req.query;

    const cycleWhere: any = {};
    if (cycleId && typeof cycleId === 'string' && cycleId !== 'ALL') {
      cycleWhere.cycleId = cycleId;
    }

    const users = await prisma.user.findMany({
      include: {
        teacherAssignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const records = await prisma.scoreRecord.findMany({
      where: cycleWhere,
      include: {
        class: true,
        subject: true,
        moderations: true,
      },
    });

    const pendingTasks: Array<{
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
      roleTitle: string;
      taskType: string;
      scope: string;
      subjectCode?: string;
      subjectName?: string;
      className?: string;
      affectedCount: number;
      status: 'PENDING' | 'OVERDUE' | 'WAITING';
      statusLabel: string;
      urgency: 'HIGH' | 'MEDIUM';
      deadline: string;
      description: string;
      targetTab: string;
      actionLabel: string;
    }> = [];

    // 1. Check Teachers with DRAFT records (haven't submitted marks)
    const teachers = users.filter(u => u.role === 'TEACHER');
    for (const t of teachers) {
      for (const assign of t.teacherAssignments) {
        const classRecords = records.filter(
          r => r.classId === assign.classId && r.subjectId === assign.subjectId
        );
        const draftCount = classRecords.filter(r => r.status === 'DRAFT').length;
        const total = classRecords.length;

        if (draftCount > 0 || total === 0) {
          pendingTasks.push({
            id: `task-teacher-${t.id}-${assign.classId}-${assign.subjectId}`,
            userId: t.id,
            userName: t.name,
            userEmail: t.email,
            userRole: t.role,
            roleTitle: 'Guru Mata Pelajaran',
            taskType: 'Kemasukan & Penyerahan Skor Mentah',
            scope: `${assign.class.name} • ${assign.subject.code} ${assign.subject.name}`,
            className: assign.class.name,
            subjectCode: assign.subject.code,
            subjectName: assign.subject.name,
            affectedCount: draftCount > 0 ? draftCount : 30,
            status: 'PENDING',
            statusLabel: draftCount > 0 ? `${draftCount} Murid Dalam Draf` : 'Belum Mula Isi',
            urgency: 'HIGH',
            deadline: 'Sebelum 20/11/2026',
            description: `Skor mentah bagi kelas ${assign.class.name} masih dalam status Draf dan belum dihantar secara rasmi untuk semakan.`,
            targetTab: 'scores',
            actionLabel: 'Buka Kemasukan Markah',
          });
        }
      }
    }

    // 2. Check KPMP with moderation quorum < 10%
    const kpmpUsers = users.filter(u => u.role === 'KPMP');
    for (const kp of kpmpUsers) {
      if (kp.subjectHeadOf) {
        const subjRecords = records.filter(r => r.subject.code === kp.subjectHeadOf);
        const totalSubj = subjRecords.length;
        const sampled = subjRecords.filter(r => r.isSampled).length;
        const requiredSample = Math.ceil(totalSubj * 0.1);

        if (totalSubj > 0 && sampled < requiredSample) {
          const subjName = subjRecords[0]?.subject.name || kp.subjectHeadOf;
          pendingTasks.push({
            id: `task-kpmp-${kp.id}-${kp.subjectHeadOf}`,
            userId: kp.id,
            userName: kp.name,
            userEmail: kp.email,
            userRole: kp.role,
            roleTitle: `Ketua Panitia (${kp.subjectHeadOf})`,
            taskType: 'Kuorum Moderasi Sampel Panitia (≥ 10%)',
            scope: `Panitia ${subjName} (${kp.subjectHeadOf})`,
            subjectCode: kp.subjectHeadOf,
            subjectName: subjName,
            className: 'Semua Kelas Tahun 4',
            affectedCount: Math.max(1, requiredSample - sampled),
            status: 'OVERDUE',
            statusLabel: `Kuorum ${((sampled / totalSubj) * 100).toFixed(1)}% < 10%`,
            urgency: 'HIGH',
            deadline: 'Sebelum 22/11/2026',
            description: `Panitia ${subjName} hanya memoderasi ${sampled}/${totalSubj} rekod. Perlu menjana sekurang-kurangnya ${Math.max(1, requiredSample - sampled)} sampel tambahan untuk mematuhi piawaian KPM.`,
            targetTab: 'moderation',
            actionLabel: 'Pusat Moderasi KPMP',
          });
        }
      }
    }

    // 3. Check Coordinator (Validation / Pre-moderation checks)
    const coordinator = users.find(u => u.role === 'COORDINATOR');
    const submittedCount = records.filter(r => r.status === 'SUBMITTED').length;
    if (coordinator) {
      pendingTasks.push({
        id: `task-coord-${coordinator.id}`,
        userId: coordinator.id,
        userName: coordinator.name,
        userEmail: coordinator.email,
        userRole: coordinator.role,
        roleTitle: 'Penyelaras Matriks Pembelajaran',
        taskType: 'Penentusahan & Semakan Format Pra-Moderasi',
        scope: 'Tahun 4 • Kitaran Semasa',
        className: 'Semua Kelas',
        affectedCount: submittedCount > 0 ? submittedCount : 30,
        status: submittedCount > 0 ? 'PENDING' : 'WAITING',
        statusLabel: submittedCount > 0 ? `${submittedCount} Rekod Menunggu Semakan` : 'Semakan Kelayakan Berkala',
        urgency: submittedCount > 0 ? 'HIGH' : 'MEDIUM',
        deadline: 'Sebelum 23/11/2026',
        description: 'Penyelaras perlu mengesahkan kelengkapan format skor murid yang telah dihantar oleh guru sebelum diserahkan kepada Ketua Panitia.',
        targetTab: 'moderation',
        actionLabel: 'Semak Rekod Dihantar',
      });
    }

    // 4. Check Super Admin / Leader (Official School Approval)
    const currentQueryUserId = req.query.userId as string | undefined;
    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
    const superAdmin = (currentQueryUserId ? superAdmins.find(u => u.id === currentQueryUserId) : null) || superAdmins[0];

    const approvedCount = records.filter(r => r.status === 'APPROVED' || r.status === 'EXPORT_READY' || r.status === 'LOCKED').length;
    const totalRecordsCount = records.length;
    const pendingApprovalCount = Math.max(0, totalRecordsCount - approvedCount);
    const readyForAdminApproval = records.filter(r => r.status === 'VALIDATED' || r.status === 'MODERATED').length;
    const draftCount = records.filter(r => r.status === 'DRAFT').length;

    if (superAdmin) {
      if (readyForAdminApproval > 0) {
        // Records that are actively awaiting admin approval
        pendingTasks.push({
          id: `task-admin-${superAdmin.id}`,
          userId: superAdmin.id,
          userName: superAdmin.name,
          userEmail: superAdmin.email,
          userRole: superAdmin.role,
          roleTitle: 'Pentadbir Utama Sistem',
          taskType: 'Kelulusan Rasmi Pentadbir Sekolah',
          scope: 'Tahun 4 • Semua Mata Pelajaran',
          className: 'Semua Kelas',
          affectedCount: readyForAdminApproval,
          status: 'PENDING',
          statusLabel: `${readyForAdminApproval} Rekod Menunggu Kelulusan`,
          urgency: 'HIGH',
          deadline: 'Sebelum 25/11/2026',
          description: `Terdapat ${readyForAdminApproval} rekod pentaksiran yang telah disemak dan kini sedia untuk kelulusan rasmi pentadbir sekolah.`,
          targetTab: 'moderation',
          actionLabel: 'Sahkan Kelulusan Rasmi',
        });
      } else if (pendingApprovalCount > 0 && draftCount > 0) {
        // Admin has approved all submitted records. Remaining records are still in draft by teachers.
        pendingTasks.push({
          id: `task-admin-${superAdmin.id}`,
          userId: superAdmin.id,
          userName: superAdmin.name,
          userEmail: superAdmin.email,
          userRole: superAdmin.role,
          roleTitle: 'Pentadbir Utama Sistem',
          taskType: 'Kelulusan Rasmi Pentadbir Sekolah',
          scope: 'Tahun 4 • Semua Mata Pelajaran',
          className: 'Semua Kelas',
          affectedCount: draftCount,
          status: 'WAITING',
          statusLabel: `Menunggu Penyerahan Guru (${draftCount} Draf)`,
          urgency: 'MEDIUM',
          deadline: 'Sebelum 25/11/2026',
          description: `Semua rekod yang dihantar telah diluluskan (${approvedCount}/${totalRecordsCount} Rekod). Menunggu guru melengkapkan skor draf sebelum kelulusan akhir.`,
          targetTab: 'moderation',
          actionLabel: 'Semak Status Sekolah',
        });
      }
      // If pendingApprovalCount === 0 (100% approved), no pending task for admin
    }

    // 5. Check Data Officer (Export SBPPA Package)
    const dataOfficer = users.find(u => u.role === 'DATA_OFFICER');
    if (dataOfficer) {
      pendingTasks.push({
        id: `task-data-${dataOfficer.id}`,
        userId: dataOfficer.id,
        userName: dataOfficer.name,
        userEmail: dataOfficer.email,
        userRole: dataOfficer.role,
        roleTitle: 'Pegawai Data Sekolah',
        taskType: 'Penjanaan Pakej SBPPA untuk Kemasukan Rasmi',
        scope: 'Tahun 4 • Kitaran 1 SAS',
        className: 'Semua Kelas',
        affectedCount: records.length,
        status: 'WAITING',
        statusLabel: 'Menunggu Kelulusan Selesai',
        urgency: 'MEDIUM',
        deadline: 'Sebelum 28/11/2026',
        description: 'Menjana pakej penyediaan XLSX/CSV SBPPA berkanun untuk muat naik atau kemasukan rasmi ke portal KPM.',
        targetTab: 'deliverables',
        actionLabel: 'Pakej SBPPA',
      });
    }

    res.json({
      totalPending: pendingTasks.length,
      highUrgencyCount: pendingTasks.filter(t => t.urgency === 'HIGH').length,
      tasks: pendingTasks,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    res.json(settingsMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update official integration settings (Strictly protected)
router.post('/settings/integration', async (req, res) => {
  try {
    const {
      hasWrittenAuthorization,
      hasApprovedApiDoc,
      hasSandboxCredentials,
      hasAdminApproval,
      apiKeyEncrypted,
      endpointUrl,
      userId,
      userName,
      userRole,
    } = req.body;

    if (userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Hanya Pentadbir Sistem boleh mengubah konfigurasi integrasi SBPPA.' });
    }

    const isFullyAuthorized = hasWrittenAuthorization && hasApprovedApiDoc && hasSandboxCredentials && hasAdminApproval;

    await prisma.systemSetting.upsert({
      where: { key: 'SBPPA_OFFICIAL_INTEGRATION_ENABLED' },
      update: { value: String(isFullyAuthorized) },
      create: { key: 'SBPPA_OFFICIAL_INTEGRATION_ENABLED', value: String(isFullyAuthorized) },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'SBPPA_ENDPOINT_URL' },
      update: { value: endpointUrl || 'https://sbppa-api.moe.gov.my/v1/mock-disabled' },
      create: { key: 'SBPPA_ENDPOINT_URL', value: endpointUrl || 'https://sbppa-api.moe.gov.my/v1/mock-disabled' },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Pentadbir Sistem',
        userRole: 'SUPER_ADMIN',
        action: 'INTEGRATION_CONFIG_UPDATE',
        entityType: 'INTEGRATION',
        details: JSON.stringify({
          isFullyAuthorized,
          hasWrittenAuthorization,
          hasApprovedApiDoc,
          hasSandboxCredentials,
          hasAdminApproval,
          notice: 'Kredensial SBPPA tidak disimpan secara teks biasa.',
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      success: true,
      enabled: isFullyAuthorized,
      message: isFullyAuthorized 
        ? 'Integrasi Rasmi diaktifkan selepas semua kriteria kuasa bertulis KPM dipenuhi.' 
        : 'Integrasi Rasmi KEKAL DINYAHAKTIFKAN kerana kriteria kebenaran belum lengkap.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full System Backup (JSON)
router.get('/backup', async (req, res) => {
  try {
    const school = await prisma.school.findFirst();
    const users = await prisma.user.findMany();
    const classes = await prisma.class.findMany();
    const subjects = await prisma.subject.findMany();
    const students = await prisma.student.findMany();
    const cycles = await prisma.assessmentCycle.findMany();
    const scores = await prisma.scoreRecord.findMany({ include: { scoreHistories: true, moderations: true } });
    const auditLogs = await prisma.auditLog.findMany();
    const settings = await prisma.systemSetting.findMany();

    const backupData = {
      backupTimestamp: new Date().toISOString(),
      school,
      users,
      classes,
      subjects,
      students,
      cycles,
      scores,
      auditLogs,
      settings,
    };

    res.setHeader('Content-Disposition', `attachment; filename="SBPPA_Backup_${school?.code || 'XCA4301'}_${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
