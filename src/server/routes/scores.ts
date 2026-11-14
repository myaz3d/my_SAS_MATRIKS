import { Router } from 'express';
import prisma from '../db';
import { validateScore, calculateMasteryLevel, canTransitionStatus, selectRandomSample } from '../../shared/validation';
import { WorkflowStatus, UserRole } from '../../shared/types';

const router = Router();

// Get scores for a class, subject, and cycle
router.get('/', async (req, res) => {
  try {
    const { cycleId, classId, subjectId, teacherId, userRole } = req.query;

    if (!cycleId || !classId || !subjectId) {
      return res.status(400).json({ error: 'cycleId, classId, and subjectId are required' });
    }

    // Role check: If TEACHER, verify assignment
    if (userRole === 'TEACHER' && teacherId) {
      const assignment = await prisma.teacherAssignment.findFirst({
        where: {
          userId: String(teacherId),
          classId: String(classId),
          subjectId: String(subjectId),
        },
      });

      if (!assignment) {
        return res.status(403).json({
          error: 'Akses ditolak: Anda tidak ditugaskan untuk mengajar kelas dan mata pelajaran ini.',
          unauthorized: true,
        });
      }
    }

    // Get all enrolled students in this class
    const students = await prisma.student.findMany({
      where: { classId: String(classId), active: true },
      orderBy: { fullName: 'asc' },
    });

    // Get existing score records
    const scoreRecords = await prisma.scoreRecord.findMany({
      where: {
        cycleId: String(cycleId),
        classId: String(classId),
        subjectId: String(subjectId),
      },
      include: {
        scoreHistories: {
          orderBy: { changedAt: 'desc' },
        },
        moderations: {
          include: { moderator: true },
          orderBy: { moderatedAt: 'desc' },
        },
      },
    });

    const scoreMap = new Map(scoreRecords.map(s => [s.studentId, s]));

    // Combine students with score records (ensuring every student in class has a row)
    const items = students.map(student => {
      const existing = scoreMap.get(student.id);
      const validation = validateScore(existing?.rawScore);

      return {
        id: existing?.id || `temp-${student.id}`,
        studentId: student.id,
        studentMykid: student.mykid,
        studentName: student.fullName,
        studentRegNo: student.studentId,
        gender: student.gender,
        classId: student.classId,
        subjectId: String(subjectId),
        cycleId: String(cycleId),
        rawScore: existing?.rawScore ?? null,
        masteryLevel: existing?.masteryLevel ?? validation.computedTP,
        status: existing?.status || 'DRAFT',
        correctionReason: existing?.correctionReason ?? null,
        isSampled: existing?.isSampled ?? false,
        validationErrors: validation.errors,
        validationWarnings: validation.warnings,
        submittedAt: existing?.submittedAt?.toISOString() || null,
        submittedBy: existing?.submittedBy || null,
        approvedAt: existing?.approvedAt?.toISOString() || null,
        approvedBy: existing?.approvedBy || null,
        lockedAt: existing?.lockedAt?.toISOString() || null,
        lockedBy: existing?.lockedBy || null,
        moderation: existing?.moderations?.[0] ? {
          id: existing.moderations[0].id,
          decision: existing.moderations[0].decision,
          comments: existing.moderations[0].comments,
          moderatorName: existing.moderations[0].moderator.name,
          moderatedAt: existing.moderations[0].moderatedAt.toISOString(),
        } : null,
        history: existing?.scoreHistories?.map(h => ({
          id: h.id,
          oldRawScore: h.oldRawScore,
          newRawScore: h.newRawScore,
          oldStatus: h.oldStatus,
          newStatus: h.newStatus,
          reason: h.reason,
          changedBy: h.changedBy,
          changedAt: h.changedAt.toISOString(),
        })) || [],
      };
    });

    // Check overall status of this batch
    const statuses = items.map(i => i.status);
    const allApproved = statuses.length > 0 && statuses.every(s => s === 'APPROVED' || s === 'EXPORT_READY' || s === 'LOCKED');
    const allSubmitted = statuses.length > 0 && statuses.every(s => s !== 'DRAFT');

    res.json({
      studentsCount: students.length,
      enteredCount: items.filter(i => i.rawScore !== null).length,
      allApproved,
      allSubmitted,
      items,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch Save / Autosave Score Grid
router.post('/batch-save', async (req, res) => {
  try {
    const { cycleId, classId, subjectId, items, userId, userName, userRole, correctionReason } = req.body;

    if (!cycleId || !classId || !subjectId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Parameter batch-save tidak lengkap.' });
    }

    // Role check for teachers
    if (userRole === 'TEACHER' && userId) {
      const assignment = await prisma.teacherAssignment.findFirst({
        where: {
          userId: String(userId),
          classId: String(classId),
          subjectId: String(subjectId),
        },
      });

      if (!assignment) {
        return res.status(403).json({ error: 'Akses ditolak: Anda tidak ditugaskan untuk mengajar kelas ini.' });
      }
    }

    const savedRecords: any[] = [];
    let updatedCount = 0;

    for (const item of items) {
      const { studentId, rawScore } = item;
      const numScore = rawScore === null || rawScore === undefined || rawScore === '' ? null : Number(rawScore);

      // Validate single score
      if (numScore !== null) {
        const val = validateScore(numScore);
        if (!val.isValid) {
          return res.status(400).json({
            error: `Skor ${rawScore} untuk murid ID ${studentId} tidak sah: ${val.errors.join(', ')}`,
          });
        }
      }

      const tp = calculateMasteryLevel(numScore);

      const existing = await prisma.scoreRecord.findUnique({
        where: {
          studentId_subjectId_cycleId: {
            studentId,
            subjectId,
            cycleId,
          },
        },
      });

      // If existing and locked, reject edit
      if (existing?.status === 'LOCKED') {
        return res.status(400).json({
          error: 'Rekod telah dikunci dan tidak boleh diedit tanpa kelulusan buka kunci khas.',
        });
      }

      // If existing and already SUBMITTED or APPROVED, require justification
      if (existing && ['SUBMITTED', 'VALIDATED', 'MODERATED', 'APPROVED', 'EXPORT_READY'].includes(existing.status)) {
        if (!correctionReason && existing.rawScore !== numScore) {
          return res.status(400).json({
            error: 'Justifikasi / sebab pembetulan markah diperlukan bagi rekod yang telah dihantar atau disahkan.',
            requiresReason: true,
          });
        }
      }

      let record;
      if (existing) {
        const hasScoreChanged = existing.rawScore !== numScore;
        record = await prisma.scoreRecord.update({
          where: { id: existing.id },
          data: {
            rawScore: numScore,
            masteryLevel: tp,
            correctionReason: hasScoreChanged && correctionReason ? correctionReason : existing.correctionReason,
          },
        });

        if (hasScoreChanged) {
          await prisma.scoreHistory.create({
            data: {
              scoreRecordId: existing.id,
              oldRawScore: existing.rawScore,
              newRawScore: numScore,
              oldStatus: existing.status,
              newStatus: existing.status,
              reason: correctionReason || 'Kemaskini skor mentah',
              changedBy: userName || 'Guru Mata Pelajaran',
            },
          });
        }
      } else {
        record = await prisma.scoreRecord.create({
          data: {
            studentId,
            classId,
            subjectId,
            cycleId,
            rawScore: numScore,
            masteryLevel: tp,
            status: 'DRAFT',
          },
        });

        if (numScore !== null) {
          await prisma.scoreHistory.create({
            data: {
              scoreRecordId: record.id,
              oldRawScore: null,
              newRawScore: numScore,
              oldStatus: 'DRAFT',
              newStatus: 'DRAFT',
              reason: 'Kemasukan skor draf kali pertama',
              changedBy: userName || 'Guru Mata Pelajaran',
            },
          });
        }
      }
      savedRecords.push(record);
      updatedCount++;
    }

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Guru',
        userRole: userRole || 'TEACHER',
        action: 'SCORE_BATCH_SAVE',
        entityType: 'SCORE',
        entityId: `${classId}_${subjectId}`,
        details: JSON.stringify({
          updatedCount,
          cycleId,
          classId,
          subjectId,
          correctionReason: correctionReason || null,
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, updatedCount, savedRecords });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Transition Workflow Status for a class & subject
router.post('/workflow-transition', async (req, res) => {
  try {
    const { cycleId, classId, subjectId, targetStatus, userId, userName, userRole, comments } = req.body;

    if (!cycleId || !classId || !subjectId || !targetStatus) {
      return res.status(400).json({ error: 'Parameter tidak lengkap.' });
    }

    const records = await prisma.scoreRecord.findMany({
      where: { cycleId, classId, subjectId },
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'Tiada rekod skor dijumpai untuk kelas dan mata pelajaran ini.' });
    }

    const currentStatus = records[0].status as WorkflowStatus;
    const transitionCheck = canTransitionStatus(currentStatus, targetStatus as WorkflowStatus, userRole as UserRole);

    if (!transitionCheck.allowed) {
      return res.status(403).json({ error: transitionCheck.reason || 'Peralihan status tidak dibenarkan bagi peranan anda.' });
    }

    // If submitting, check that all scores are entered and valid
    if (targetStatus === 'SUBMITTED') {
      const emptyScores = records.filter(r => r.rawScore === null);
      if (emptyScores.length > 0) {
        return res.status(400).json({
          error: `Terdapat ${emptyScores.length} murid yang masih belum mempunyai skor mentah. Sila lengkapkan semua markah sebelum penyerahan.`,
        });
      }
    }

    // Update records status
    const updateData: any = { status: targetStatus };
    if (targetStatus === 'SUBMITTED') {
      updateData.submittedAt = new Date();
      updateData.submittedBy = userName;
    } else if (targetStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = userName;
    } else if (targetStatus === 'LOCKED') {
      updateData.lockedAt = new Date();
      updateData.lockedBy = userName;
    }

    await prisma.scoreRecord.updateMany({
      where: { cycleId, classId, subjectId },
      data: updateData,
    });

    // Record score history for each record
    for (const r of records) {
      await prisma.scoreHistory.create({
        data: {
          scoreRecordId: r.id,
          oldRawScore: r.rawScore,
          newRawScore: r.rawScore,
          oldStatus: currentStatus,
          newStatus: targetStatus,
          reason: comments || `Peralihan status ke ${targetStatus}`,
          changedBy: userName || 'Pengguna',
        },
      });
    }

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Pengguna',
        userRole: userRole || 'UNKNOWN',
        action: `WORKFLOW_${targetStatus}`,
        entityType: 'SCORE',
        entityId: `${classId}_${subjectId}`,
        details: JSON.stringify({
          fromStatus: currentStatus,
          toStatus: targetStatus,
          count: records.length,
          comments: comments || null,
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      success: true,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      updatedCount: records.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// KPMP Random Sample Generator (at least 10% sample)
router.post('/sample-random', async (req, res) => {
  try {
    const { cycleId, classId, subjectId, samplePercentage = 10, userId, userName, userRole } = req.body;

    if (userRole !== 'KPMP' && userRole !== 'SUPER_ADMIN' && userRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Hanya KPMP atau Penyelaras boleh menjana sampel moderasi.' });
    }

    const records = await prisma.scoreRecord.findMany({
      where: { cycleId, classId, subjectId },
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'Tiada rekod skor untuk kelas dan mata pelajaran ini.' });
    }

    // Reset current sampling
    await prisma.scoreRecord.updateMany({
      where: { cycleId, classId, subjectId },
      data: { isSampled: false },
    });

    // Select random sample >= 10%
    const sampled = selectRandomSample(records, samplePercentage);
    const sampledIds = sampled.map(s => s.id);

    await prisma.scoreRecord.updateMany({
      where: { id: { in: sampledIds } },
      data: { isSampled: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'KPMP',
        userRole: userRole || 'KPMP',
        action: 'SCORE_SAMPLE_GENERATED',
        entityType: 'SCORE',
        entityId: `${classId}_${subjectId}`,
        details: JSON.stringify({
          totalRecords: records.length,
          sampledCount: sampled.length,
          percentage: ((sampled.length / records.length) * 100).toFixed(1) + '%',
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      success: true,
      totalRecords: records.length,
      sampledCount: sampled.length,
      sampledPercentage: ((sampled.length / records.length) * 100).toFixed(1),
      sampledIds,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Record KPMP Moderation Decision
router.post('/moderate', async (req, res) => {
  try {
    const { scoreRecordId, decision, comments, moderatedScore, moderatorId, moderatorName, userRole } = req.body;

    if (!scoreRecordId || !decision) {
      return res.status(400).json({ error: 'scoreRecordId dan decision diperlukan.' });
    }

    if (!['APPROVED', 'NEEDS_CORRECTION', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Keputusan moderasi tidak sah.' });
    }

    if ((decision === 'NEEDS_CORRECTION' || decision === 'REJECTED') && (!comments || comments.trim() === '')) {
      return res.status(400).json({ error: 'Ulasan/sebab penolakan wajib diisi untuk rekod yang memerlukan pembetulan atau ditolak.' });
    }

    const record = await prisma.scoreRecord.findUnique({
      where: { id: scoreRecordId },
    });

    if (!record) {
      return res.status(404).json({ error: 'Rekod skor tidak dijumpai.' });
    }

    // Save moderation entry
    const mod = await prisma.moderationRecord.create({
      data: {
        scoreRecordId,
        moderatorId,
        originalScore: record.rawScore || 0,
        moderatedScore: moderatedScore !== undefined && moderatedScore !== null ? Number(moderatedScore) : record.rawScore,
        decision,
        comments,
      },
    });

    // Update status if rejected/needs correction -> return to DRAFT or MODERATED
    const newStatus = decision === 'APPROVED' ? 'MODERATED' : 'DRAFT';
    await prisma.scoreRecord.update({
      where: { id: scoreRecordId },
      data: {
        status: newStatus,
        rawScore: moderatedScore !== undefined && moderatedScore !== null ? Number(moderatedScore) : record.rawScore,
        correctionReason: decision !== 'APPROVED' ? `Maklum Balas Moderasi KPMP: ${comments}` : record.correctionReason,
      },
    });

    // History
    await prisma.scoreHistory.create({
      data: {
        scoreRecordId,
        oldRawScore: record.rawScore,
        newRawScore: moderatedScore !== undefined && moderatedScore !== null ? Number(moderatedScore) : record.rawScore,
        oldStatus: record.status,
        newStatus,
        reason: `Keputusan Moderasi KPMP: ${decision}. Catatan: ${comments || 'Tiada'}`,
        changedBy: moderatorName || 'KPMP',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: moderatorId,
        userName: moderatorName || 'KPMP',
        userRole: userRole || 'KPMP',
        action: 'SCORE_MODERATED',
        entityType: 'SCORE',
        entityId: scoreRecordId,
        details: JSON.stringify({
          decision,
          originalScore: record.rawScore,
          moderatedScore,
          comments,
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, moderation: mod, newStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock request and approval
router.post('/unlock', async (req, res) => {
  try {
    const { cycleId, classId, subjectId, reason, userId, userName, userRole } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Justifikasi buka kunci rekod wajib dinyatakan.' });
    }

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Hanya Pentadbir Sekolah atau Penyelaras boleh meluluskan buka kunci rekod.' });
    }

    const records = await prisma.scoreRecord.findMany({
      where: { cycleId, classId, subjectId },
    });

    await prisma.scoreRecord.updateMany({
      where: { cycleId, classId, subjectId },
      data: {
        status: 'DRAFT',
        lockedAt: null,
        lockedBy: null,
        correctionReason: `Buka kunci dibenarkan: ${reason}`,
      },
    });

    for (const r of records) {
      await prisma.scoreHistory.create({
        data: {
          scoreRecordId: r.id,
          oldRawScore: r.rawScore,
          newRawScore: r.rawScore,
          oldStatus: r.status,
          newStatus: 'DRAFT',
          reason: `Buka Kunci Rekod: ${reason}`,
          changedBy: userName || 'Pentadbir',
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Pentadbir',
        userRole: userRole || 'SUPER_ADMIN',
        action: 'SCORE_UNLOCK_APPROVED',
        entityType: 'SCORE',
        entityId: `${classId}_${subjectId}`,
        details: JSON.stringify({ reason, unlockedCount: records.length }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, unlockedCount: records.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
