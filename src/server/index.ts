import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import prisma from './db';
import authRoutes from './routes/auth';
import rosterRoutes from './routes/roster';
import cycleRoutes from './routes/cycles';
import scoreRoutes from './routes/scores';
import deliverableRoutes from './routes/deliverables';
import auditRoutes from './routes/audit';
import systemRoutes from './routes/system';
import classesRoutes from './routes/classes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/roster', rosterRoutes);
  app.use('/api/classes', classesRoutes);
  app.use('/api/cycles', cycleRoutes);
  app.use('/api/scores', scoreRoutes);
  app.use('/api/deliverables', deliverableRoutes);
  app.use('/api/audit-logs', auditRoutes);
  app.use('/api/system', systemRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      app: 'my_SAS_MATRIKS - Sistem Pengurusan Pentaksiran Matriks Pembelajaran Sekolah Rendah',
      school: 'Sekolah Agama Suria, Tuaran, Sabah (XCA4301)',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      banner: 'Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM.',
    });
  });

  // Serve static client assets if built
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const app = createApp();
  const PORT = process.env.PORT || 3001;

  // Auto-seed if database is new or empty on cloud startup
  (async () => {
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('Pangkalan data baru dikesan. Menjana data demo Sekolah Agama Suria (auto-seed)...');
        const { seedDatabase } = await import('./seed');
        await seedDatabase();
      }
    } catch (e) {
      console.warn('Auto-seed check note:', e);
    }
  })();

  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  my_SAS_MATRIKS - PENGURUSAN MATRIKS PEMBELAJARAN`);
    console.log(`  Sekolah: Sekolah Agama Suria, Tuaran, Sabah (Kod: XCA4301)`);
    console.log(`  Pelayan berjalan di: http://localhost:${PORT}`);
    console.log(`================================================================`);
  });
}
