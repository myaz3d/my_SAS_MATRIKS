import { Router } from 'express';
import prisma from '../db';
import * as XLSX from 'xlsx';

const router = Router();

// Get audit logs with filter & pagination
router.get('/', async (req, res) => {
  try {
    const { action, entityType, limit = 100 } = req.query;
    const where: any = {};
    if (action && typeof action === 'string' && action !== 'ALL') {
      where.action = action;
    }
    if (entityType && typeof entityType === 'string' && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      include: {
        user: {
          select: { name: true, role: true, email: true },
        },
      },
    });

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export audit logs as CSV
router.get('/export', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const rows = logs.map(l => ({
      LOG_ID: l.id,
      TARIKH_MASA: l.createdAt.toISOString(),
      PENGGUNA: l.userName,
      PERANAN: l.userRole,
      TINDAKAN: l.action,
      ENTITI: l.entityType,
      ID_ENTITI: l.entityId || '-',
      BUTIRAN: l.details,
      ALAMAT_IP: l.ipAddress || '127.0.0.1',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Disposition', `attachment; filename="Log_Audit_SBPPA_${Date.now()}.csv"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
