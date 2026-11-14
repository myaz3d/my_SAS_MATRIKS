import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Get list of all users for role switcher and management
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        school: true,
        teacherAssignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Sila masukkan alamat emel rasmi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        school: true,
        teacherAssignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Akaun pengguna dengan emel ini tidak ditemui dalam sistem SAS.' });
    }

    // Verify password if provided
    if (password && user.passwordHash && password !== user.passwordHash) {
      return res.status(401).json({ error: 'Kata laluan tidak tepat. Sila semak semula atau hubungi Guru Besar / Pentadbir.' });
    }

    // Log the login audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: JSON.stringify({ message: `Log masuk berjaya sebagai ${user.role} (${user.name})` }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      success: true,
      user,
      token: `sas-token-${user.id}-${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { userId, userName, userRole } = req.body;

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          userName: userName || 'Pengguna',
          userRole: userRole || 'USER',
          action: 'USER_LOGOUT',
          entityType: 'USER',
          entityId: userId,
          details: JSON.stringify({ message: `Log keluar sesi sistem oleh ${userName || userId}` }),
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    }

    res.json({ success: true, message: 'Log keluar berjaya direkodkan.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (User ID Management)
router.post('/users', async (req, res) => {
  try {
    const { name, email, role, subjectHeadOf, password, actorId, actorName, actorRole } = req.body;

    // RBAC check: Only SUPER_ADMIN and COORDINATOR can create users
    if (actorRole && actorRole !== 'SUPER_ADMIN' && actorRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Pentadbir (SUPER_ADMIN) atau Penyelaras mempunyai kebenaran mendaftar pengguna.' });
    }

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Nama, emel, dan peranan pengguna diperlukan.' });
    }

    const validRoles = ['SUPER_ADMIN', 'COORDINATOR', 'TEACHER', 'KPMP', 'LEADER', 'DATA_OFFICER'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Peranan pengguna tidak sah.' });
    }

    const school = await prisma.school.findFirst();
    if (!school) {
      return res.status(400).json({ error: 'Data sekolah tidak dijumpai.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: `Emel pengguna ${email} telah sedia wujud dalam sistem.` });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role,
        subjectHeadOf: role === 'KPMP' ? (subjectHeadOf || null) : null,
        passwordHash: password || 'sas12345',
        schoolId: school.id,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        userName: actorName || 'Pentadbir Sistem',
        userRole: actorRole || 'SUPER_ADMIN',
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: newUser.id,
        details: JSON.stringify({
          userId: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          subjectHeadOf: newUser.subjectHeadOf,
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, subjectHeadOf, actorId, actorName, actorRole } = req.body;

    if (actorRole && actorRole !== 'SUPER_ADMIN' && actorRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Pentadbir (SUPER_ADMIN) atau Penyelaras mempunyai kebenaran mengemas kini pengguna.' });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Pengguna tidak ditemui.' });
    }

    // If email is changing, check duplicate
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ error: 'Emel telah digunakan oleh akaun lain.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || existing.name,
        email: email || existing.email,
        role: role || existing.role,
        subjectHeadOf: role === 'KPMP' ? subjectHeadOf : null,
      },
      include: {
        school: true,
        teacherAssignments: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        userName: actorName || 'Pentadbir Sistem',
        userRole: actorRole || 'SUPER_ADMIN',
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: id,
        details: JSON.stringify({
          old: { name: existing.name, email: existing.email, role: existing.role },
          new: { name: updatedUser.name, email: updatedUser.email, role: updatedUser.role },
        }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, actorId, actorName, actorRole } = req.body;

    if (actorRole && actorRole !== 'SUPER_ADMIN' && actorRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Pentadbir (SUPER_ADMIN) atau Penyelaras mempunyai kebenaran set semula kata laluan.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemui.' });
    }

    const pwd = newPassword || 'sas12345';
    await prisma.user.update({
      where: { id },
      data: { passwordHash: pwd },
    });

    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        userName: actorName || 'Pentadbir Sistem',
        userRole: actorRole || 'SUPER_ADMIN',
        action: 'USER_PASSWORD_RESET',
        entityType: 'USER',
        entityId: id,
        details: JSON.stringify({ message: `Kata laluan telah diset semula untuk ${user.name} (${user.email})` }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, message: `Kata laluan bagi ${user.name} berjaya diset semula.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user account
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { actorId, actorName, actorRole } = req.body;

    if (actorRole && actorRole !== 'SUPER_ADMIN' && actorRole !== 'COORDINATOR') {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Pentadbir (SUPER_ADMIN) atau Penyelaras mempunyai kebenaran memadam akaun pengguna.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemui.' });
    }

    if (user.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
      if (superAdminCount <= 1) {
        return res.status(400).json({ error: 'Akaun Pentadbir Utama (SUPER_ADMIN) terakhir tidak boleh dipadam.' });
      }
    }

    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: actorId || null,
        userName: actorName || 'Pentadbir Sistem',
        userRole: actorRole || 'SUPER_ADMIN',
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: id,
        details: JSON.stringify({ name: user.name, email: user.email, role: user.role }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({ success: true, message: `Akaun pengguna ${user.name} telah dipadam.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
