import { Router } from 'express';
import prisma from '../db';

const router = Router();

// GET all classes with detailed student counts, gender breakdown & teacher assignments
router.get('/', async (req, res) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(404).json({ error: 'Maklumat sekolah tidak dijumpai' });
    }

    const classes = await prisma.class.findMany({
      where: { schoolId: school.id },
      include: {
        students: {
          select: { id: true, gender: true },
        },
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
            subject: { select: { id: true, code: true, name: true } },
          },
        },
        _count: {
          select: {
            students: true,
            scoreRecords: true,
          },
        },
      },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });

    const roomMapping: Record<string, string> = {
      '4 Cemerlang': 'Blok Al-Ghazali, Aras 1',
      '4 Gemilang': 'Blok Ibn Sina, Aras 1',
      '4 Terbilang': 'Blok Al-Farabi, Aras 2',
    };

    const formatted = classes.map(c => {
      const maleCount = c.students.filter(s => s.gender === 'L').length;
      const femaleCount = c.students.filter(s => s.gender === 'P').length;
      
      return {
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        year: c.year,
        roomLocation: roomMapping[c.name] || `Blok Utama, Bilik ${c.name}`,
        totalStudents: c.students.length,
        maleStudents: maleCount,
        femaleStudents: femaleCount,
        totalScores: c._count.scoreRecords,
        assignments: c.assignments.map(a => ({
          id: a.id,
          teacherId: a.user.id,
          teacherName: a.user.name,
          teacherEmail: a.user.email,
          teacherRole: a.user.role,
          subjectId: a.subject.id,
          subjectCode: a.subject.code,
          subjectName: a.subject.name,
        })),
        createdAt: c.createdAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single class details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
        assignments: {
          include: {
            user: true,
            subject: true,
          },
        },
      },
    });

    if (!cls) {
      return res.status(404).json({ error: 'Kelas tidak dijumpai' });
    }

    res.json(cls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new class
router.post('/', async (req, res) => {
  try {
    const { name, gradeLevel = 4, year = '2026/2027', roomLocation } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nama kelas adalah wajib' });
    }

    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(400).json({ error: 'Rekod sekolah tidak wujud' });
    }

    // Check duplicate class
    const existing = await prisma.class.findFirst({
      where: {
        schoolId: school.id,
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        year,
      },
    });

    if (existing) {
      return res.status(400).json({ error: `Kelas ${name} bagi Tahun ${gradeLevel} (${year}) sudah wujud` });
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        year,
        schoolId: school.id,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userName: 'Puan Maimunah Binti Tajuddin',
        userRole: 'SUPER_ADMIN',
        action: 'CLASS_CREATE',
        entityType: 'CLASS',
        entityId: newClass.id,
        details: JSON.stringify({
          className: newClass.name,
          gradeLevel: newClass.gradeLevel,
          year: newClass.year,
          roomLocation,
        }),
      },
    });

    res.status(201).json({
      message: `Kelas ${newClass.name} berjaya dicipta`,
      class: newClass,
    });
  } catch (error: any) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update class details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gradeLevel, year } = req.body;

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Kelas tidak dijumpai' });
    }

    const updated = await prisma.class.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        gradeLevel: gradeLevel !== undefined ? Number(gradeLevel) : existing.gradeLevel,
        year: year !== undefined ? year : existing.year,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userName: 'Puan Maimunah Binti Tajuddin',
        userRole: 'SUPER_ADMIN',
        action: 'CLASS_UPDATE',
        entityType: 'CLASS',
        entityId: id,
        details: JSON.stringify({
          previousName: existing.name,
          newName: updated.name,
          gradeLevel: updated.gradeLevel,
        }),
      },
    });

    res.json({
      message: `Maklumat kelas ${updated.name} berjaya dikemaskini`,
      class: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign or update teacher for subject in class
router.post('/:id/assignments', async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { userId, subjectId } = req.body;

    if (!userId || !subjectId) {
      return res.status(400).json({ error: 'Sila pilih subjek dan guru yang sah' });
    }

    const cls = await prisma.class.findUnique({ where: { id: classId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });

    if (!cls || !user || !subject) {
      return res.status(404).json({ error: 'Kelas, guru atau subjek tidak sah' });
    }

    // Check if an existing assignment already exists for this class and subject
    const existing = await prisma.teacherAssignment.findFirst({
      where: { classId, subjectId },
      include: { user: true },
    });

    let assignment;
    let action = 'TEACHER_ASSIGN';
    let previousTeacher = null;

    if (existing) {
      previousTeacher = existing.user.name;
      // Delete old assignment to avoid unique constraint conflict, then create new
      await prisma.teacherAssignment.delete({ where: { id: existing.id } });
      assignment = await prisma.teacherAssignment.create({
        data: {
          userId,
          classId,
          subjectId,
        },
      });
      action = 'TEACHER_REASSIGN';
    } else {
      assignment = await prisma.teacherAssignment.create({
        data: {
          userId,
          classId,
          subjectId,
        },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userName: 'Puan Maimunah Binti Tajuddin',
        userRole: 'SUPER_ADMIN',
        action,
        entityType: 'ASSIGNMENT',
        entityId: assignment.id,
        details: JSON.stringify({
          className: cls.name,
          subjectCode: subject.code,
          subjectName: subject.name,
          newTeacher: user.name,
          previousTeacher,
        }),
      },
    });

    res.json({
      message: previousTeacher 
        ? `Guru bagi ${subject.name} berjaya dikemaskini daripada ${previousTeacher} kepada ${user.name}`
        : `Penugasan ${user.name} bagi ${subject.name} di ${cls.name} berjaya disimpan`,
      assignment,
    });
  } catch (error: any) {
    console.error('Error assigning teacher:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE assignment for subject in class
router.delete('/:classId/assignments/:assignmentId', async (req, res) => {
  try {
    const { classId, assignmentId } = req.params;

    const assignment = await prisma.teacherAssignment.findUnique({
      where: { id: assignmentId },
      include: { user: true, subject: true, class: true },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Rekod penugasan tidak dijumpai' });
    }

    await prisma.teacherAssignment.delete({ where: { id: assignmentId } });

    await prisma.auditLog.create({
      data: {
        userName: 'Puan Maimunah Binti Tajuddin',
        userRole: 'SUPER_ADMIN',
        action: 'TEACHER_ASSIGN_DELETE',
        entityType: 'ASSIGNMENT',
        entityId: assignmentId,
        details: JSON.stringify({
          className: assignment.class.name,
          subjectName: assignment.subject.name,
          teacherName: assignment.user.name,
        }),
      },
    });

    res.json({ message: `Penugasan ${assignment.user.name} bagi ${assignment.subject.name} telah dipadam` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE class
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, scoreRecords: true } },
      },
    });

    if (!cls) {
      return res.status(404).json({ error: 'Kelas tidak dijumpai' });
    }

    // Protection: cannot delete class with registered students
    if (cls._count.students > 0) {
      return res.status(400).json({
        error: `Kelas ${cls.name} tidak boleh dipadam kerana masih mempunyai ${cls._count.students} murid berdaftar. Sila pindahkan atau padam murid terlebih dahulu.`,
      });
    }

    await prisma.class.delete({ where: { id } });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userName: 'Puan Maimunah Binti Tajuddin',
        userRole: 'SUPER_ADMIN',
        action: 'CLASS_DELETE',
        entityType: 'CLASS',
        entityId: id,
        details: JSON.stringify({ className: cls.name }),
      },
    });

    res.json({ message: `Kelas ${cls.name} berjaya dipadam` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
