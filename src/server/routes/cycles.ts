import { Router } from 'express';
import prisma from '../db';

const router = Router();

// Get all assessment cycles
router.get('/', async (req, res) => {
  try {
    const cycles = await prisma.assessmentCycle.findMany({
      include: {
        _count: {
          select: { scoreRecords: true },
        },
      },
      orderBy: { startDate: 'desc' },
    });
    res.json(cycles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update cycle status (DRAFT, ACTIVE, CLOSED, LOCKED)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId, userName, userRole, reason } = req.body;

    if (!['DRAFT', 'ACTIVE', 'CLOSED', 'LOCKED'].includes(status)) {
      return res.status(400).json({ error: 'Status kitaran tidak sah.' });
    }

    const updated = await prisma.assessmentCycle.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        userName: userName || 'Penyelaras MP',
        userRole: userRole || 'COORDINATOR',
        action: 'CYCLE_STATUS_CHANGE',
        entityType: 'CYCLE',
        entityId: id,
        details: JSON.stringify({ newStatus: status, reason: reason || 'Kemas kini status kitaran pentaksiran' }),
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
