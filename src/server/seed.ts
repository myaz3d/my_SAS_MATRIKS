import prisma from './db';
import { calculateMasteryLevel } from '../shared/validation';

export async function seedDatabase() {
  console.log('--- Memulakan Pensediaan Data Demo SBPPA Matriks Pembelajaran ---');

  // Clear existing records
  await prisma.systemSetting.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.moderationRecord.deleteMany();
  await prisma.scoreHistory.deleteMany();
  await prisma.scoreRecord.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.assessmentCycle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  // 1. Create School
  const school = await prisma.school.create({
    data: {
      code: 'XCA4301',
      name: 'Sekolah Agama Suria',
      ppd: 'PPD Tuaran',
      state: 'Sabah',
    },
  });
  console.log(`Sekolah dicipta: ${school.name} (${school.code}) - PPD Tuaran, Sabah`);

  // 2. Create Users
  const usersData = [
    {
      email: 'admin@sekolah.edu.my',
      name: 'Puan Maimunah Binti Tajuddin',
      role: 'SUPER_ADMIN',
      passwordHash: 'admin123',
    },
    {
      email: 'penyelaras@sekolah.edu.my',
      name: 'Ustaz Ahmad Fauzi Bin Hassan',
      role: 'COORDINATOR',
      passwordHash: 'penyelaras123',
    },
    {
      email: 'kpmp.bm@sekolah.edu.my',
      name: 'Cikgu Siti Nurhaliza Binti Daud',
      role: 'KPMP',
      subjectHeadOf: 'MP01',
      passwordHash: 'kpmp123',
    },
    {
      email: 'kpmp.mat@sekolah.edu.my',
      name: 'Cikgu Tan Wei Keong',
      role: 'KPMP',
      subjectHeadOf: 'MP03',
      passwordHash: 'kpmp123',
    },
    {
      email: 'guru.bm1@sekolah.edu.my',
      name: 'Cikgu Aminah Binti Yusof',
      role: 'TEACHER',
      passwordHash: 'guru123',
    },
    {
      email: 'guru.mat1@sekolah.edu.my',
      name: 'Cikgu Lim Mei Ling',
      role: 'TEACHER',
      passwordHash: 'guru123',
    },
    {
      email: 'guru.sn1@sekolah.edu.my',
      name: 'Cikgu Rajesh Kumar a/l Selvam',
      role: 'TEACHER',
      passwordHash: 'guru123',
    },
    {
      email: 'pkp@sekolah.edu.my',
      name: 'Puan Zuraida Binti Ibrahim',
      role: 'LEADER',
      passwordHash: 'leader123',
    },
    {
      email: 'data@sekolah.edu.my',
      name: 'En. Faizal Bin Othman',
      role: 'DATA_OFFICER',
      passwordHash: 'data123',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        schoolId: school.id,
      },
    });
    createdUsers[u.email] = user;
  }
  console.log(`${Object.keys(createdUsers).length} pengguna dicipta.`);

  // 3. Create Subjects
  const subjectsData = [
    { code: 'MP01', name: 'Bahasa Melayu', minScore: 0, maxScore: 100 },
    { code: 'MP02', name: 'Bahasa Inggeris', minScore: 0, maxScore: 100 },
    { code: 'MP03', name: 'Matematik', minScore: 0, maxScore: 100 },
    { code: 'MP04', name: 'Sains', minScore: 0, maxScore: 100 },
    { code: 'MP05', name: 'Sejarah', minScore: 0, maxScore: 100 },
    { code: 'MP06', name: 'Pendidikan Islam / Moral', minScore: 0, maxScore: 100 },
  ];

  const createdSubjects: Record<string, any> = {};
  for (const s of subjectsData) {
    const sub = await prisma.subject.create({ data: s });
    createdSubjects[s.code] = sub;
  }
  console.log(`${Object.keys(createdSubjects).length} mata pelajaran dicipta.`);

  // 4. Create Classes
  const classesData = [
    { name: '4 Cemerlang', gradeLevel: 4, year: '2026/2027' },
    { name: '4 Gemilang', gradeLevel: 4, year: '2026/2027' },
    { name: '4 Terbilang', gradeLevel: 4, year: '2026/2027' },
  ];

  const createdClasses: Record<string, any> = {};
  for (const c of classesData) {
    const cls = await prisma.class.create({
      data: {
        ...c,
        schoolId: school.id,
      },
    });
    createdClasses[c.name] = cls;
  }
  console.log(`${Object.keys(createdClasses).length} kelas dicipta.`);

  // 5. Create Teacher Assignments
  const assignments = [
    { userEmail: 'guru.bm1@sekolah.edu.my', className: '4 Cemerlang', subCode: 'MP01' },
    { userEmail: 'guru.mat1@sekolah.edu.my', className: '4 Cemerlang', subCode: 'MP03' },
    { userEmail: 'kpmp.bm@sekolah.edu.my', className: '4 Gemilang', subCode: 'MP01' },
    { userEmail: 'guru.sn1@sekolah.edu.my', className: '4 Gemilang', subCode: 'MP04' },
    { userEmail: 'kpmp.mat@sekolah.edu.my', className: '4 Terbilang', subCode: 'MP03' },
    { userEmail: 'penyelaras@sekolah.edu.my', className: '4 Cemerlang', subCode: 'MP06' },
    { userEmail: 'guru.bm1@sekolah.edu.my', className: '4 Terbilang', subCode: 'MP05' },
  ];

  for (const a of assignments) {
    await prisma.teacherAssignment.create({
      data: {
        userId: createdUsers[a.userEmail].id,
        classId: createdClasses[a.className].id,
        subjectId: createdSubjects[a.subCode].id,
      },
    });
  }
  console.log(`${assignments.length} penugasan guru direkodkan.`);

  // 6. Create Students (30 per class = 90 students)
  const studentNamesMale = [
    'Adam Harith Bin Razali', 'Muhammad Danial Bin Yusof', 'Chong Wei Jun', 'Suresh a/l Mohan',
    'Amirul Haziq Bin Kamaruddin', 'Darren Tan Yi Hang', 'Pravin a/l Chandran', 'Ahmad Faris Bin Azlan',
    'Lucas Wong Jun Hao', 'Muhammad Rayyan Bin Shahrul', 'Nicholas Lee Jin Jie', 'Dinesh a/l Kumar',
    'Aidil Putra Bin Zulkifli', 'Jason Ooi Kai Shen', 'Aqil Naufal Bin Bakar'
  ];
  const studentNamesFemale = [
    'Nurul Iman Binti Zaidi', 'Sarah Binti Azman', 'Chloe Tan Xin Yi', 'Ananya a/p Ravi',
    'Nur Aina Sofea Binti Rosli', 'Lim Jia Ying', 'Kavitha a/p Subramaniam', 'Nur Fadhilah Binti Ramli',
    'Rachel Chan Wei Ling', 'Siti Maryam Binti Khairi', 'Tee Xin Rou', 'Divya a/p Murugan',
    'Putri Nur Balqis Binti Halim', 'Grace Ng Hui Min', 'Nur Damia Husna Binti Shukri'
  ];

  const createdStudents: any[] = [];
  let regNoCounter = 16001;

  for (const [className, cls] of Object.entries(createdClasses)) {
    const classPrefix = className.split(' ')[1][0]; // C, G, T
    for (let i = 0; i < 30; i++) {
      const isMale = i < 15;
      const name = isMale ? studentNamesMale[i] : studentNamesFemale[i - 15];
      const gender = isMale ? 'L' : 'P';
      const mykidBirth = 160100 + (regNoCounter % 365) + 1;
      const mykid = `${mykidBirth}-14-${String(1000 + (regNoCounter % 9000))}`;
      const studentId = `SAS-${classPrefix}${String(i + 1).padStart(2, '0')}`;

      const student = await prisma.student.create({
        data: {
          studentId,
          mykid,
          fullName: `${name}`,
          gender,
          classId: cls.id,
        },
      });
      createdStudents.push(student);
      regNoCounter++;
    }
  }
  console.log(`${createdStudents.length} murid berjaya didaftarkan (30 murid x 3 kelas).`);

  // 7. Create Assessment Cycles
  const cycle1 = await prisma.assessmentCycle.create({
    data: {
      name: 'Kitaran 1 - Pertengahan Sesi 2026/2027',
      academicYear: '2026/2027',
      term: 1,
      targetLevel: 4,
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-06-30'),
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  const cycle2 = await prisma.assessmentCycle.create({
    data: {
      name: 'Kitaran 2 - Akhir Sesi 2026/2027',
      academicYear: '2026/2027',
      term: 2,
      targetLevel: 4,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-30'),
      status: 'DRAFT',
      schoolId: school.id,
    },
  });
  console.log(`2 Kitaran penilaian dicipta: ${cycle1.name} (AKTIF), ${cycle2.name} (DRAF).`);

  // 8. Populate Score Records for Cycle 1
  // Class 4 Cemerlang:
  // - Bahasa Melayu (MP01): Fully submitted, moderated by KPMP BM (4 sampled >= 10%), Approved & Export-Ready!
  // - Matematik (MP03): Entered, Submitted, Validated. Contains 3 students needing intervention (<40).
  // Class 4 Gemilang:
  // - Sains (MP04): Draft stage (partially entered).
  // - Bahasa Inggeris (MP02): Draft stage.
  // Class 4 Terbilang:
  // - Matematik (MP03): Submitted.

  const students4Cem = createdStudents.filter(s => s.classId === createdClasses['4 Cemerlang'].id);
  const students4Gem = createdStudents.filter(s => s.classId === createdClasses['4 Gemilang'].id);
  const students4Ter = createdStudents.filter(s => s.classId === createdClasses['4 Terbilang'].id);

  console.log('Menjana rekod skor mentah bagi murid...');

  // 4 Cemerlang - Bahasa Melayu
  for (let i = 0; i < students4Cem.length; i++) {
    const student = students4Cem[i];
    // Generate realistic marks between 45 and 96
    const baseMark = 50 + ((i * 7) % 45);
    const rawScore = Math.min(98, baseMark);
    const tp = calculateMasteryLevel(rawScore);
    const isSampled = i < 4; // 4 out of 30 is 13.3% > 10%

    const scoreRec = await prisma.scoreRecord.create({
      data: {
        studentId: student.id,
        classId: createdClasses['4 Cemerlang'].id,
        subjectId: createdSubjects['MP01'].id,
        cycleId: cycle1.id,
        rawScore,
        masteryLevel: tp,
        status: 'EXPORT_READY',
        isSampled,
        submittedAt: new Date('2026-05-15T09:30:00Z'),
        submittedBy: createdUsers['guru.bm1@sekolah.edu.my'].name,
        approvedAt: new Date('2026-05-20T14:00:00Z'),
        approvedBy: createdUsers['admin@sekolah.edu.my'].name,
      },
    });

    // Score History
    await prisma.scoreHistory.create({
      data: {
        scoreRecordId: scoreRec.id,
        oldRawScore: null,
        newRawScore: rawScore,
        oldStatus: 'DRAFT',
        newStatus: 'EXPORT_READY',
        reason: 'Kemasukan skor instrumen MP01 & pengesahan lengkap',
        changedBy: createdUsers['guru.bm1@sekolah.edu.my'].name,
      },
    });

    // Moderation Record for sampled records
    if (isSampled) {
      await prisma.moderationRecord.create({
        data: {
          scoreRecordId: scoreRec.id,
          moderatorId: createdUsers['kpmp.bm@sekolah.edu.my'].id,
          originalScore: rawScore,
          moderatedScore: rawScore,
          decision: 'APPROVED',
          comments: 'Skor mematuhi rubrik KPM dan bukti instrumen lengkap.',
          moderatedAt: new Date('2026-05-18T11:15:00Z'),
        },
      });
    }
  }

  // 4 Cemerlang - Matematik
  for (let i = 0; i < students4Cem.length; i++) {
    const student = students4Cem[i];
    // Generate some scores below 40 for intervention testing (e.g. index 3, 11, 24)
    let rawScore = 52 + ((i * 11) % 42);
    if (i === 3) rawScore = 34; // Needs intervention
    if (i === 11) rawScore = 28; // Needs intervention
    if (i === 24) rawScore = 38; // Needs intervention
    const tp = calculateMasteryLevel(rawScore);

    const scoreRec = await prisma.scoreRecord.create({
      data: {
        studentId: student.id,
        classId: createdClasses['4 Cemerlang'].id,
        subjectId: createdSubjects['MP03'].id,
        cycleId: cycle1.id,
        rawScore,
        masteryLevel: tp,
        status: 'VALIDATED',
        isSampled: false,
        submittedAt: new Date('2026-05-16T10:00:00Z'),
        submittedBy: createdUsers['guru.mat1@sekolah.edu.my'].name,
      },
    });

    await prisma.scoreHistory.create({
      data: {
        scoreRecordId: scoreRec.id,
        oldRawScore: null,
        newRawScore: rawScore,
        oldStatus: 'DRAFT',
        newStatus: 'VALIDATED',
        reason: 'Penyerahan skor Matematik untuk moderasi KPMP',
        changedBy: createdUsers['guru.mat1@sekolah.edu.my'].name,
      },
    });
  }

  // 4 Gemilang - Sains (partially entered, DRAFT)
  for (let i = 0; i < 20; i++) {
    const student = students4Gem[i];
    const rawScore = 60 + ((i * 9) % 35);
    const tp = calculateMasteryLevel(rawScore);

    await prisma.scoreRecord.create({
      data: {
        studentId: student.id,
        classId: createdClasses['4 Gemilang'].id,
        subjectId: createdSubjects['MP04'].id,
        cycleId: cycle1.id,
        rawScore,
        masteryLevel: tp,
        status: 'DRAFT',
      },
    });
  }

  // 4 Terbilang - Sejarah (DRAFT)
  for (let i = 0; i < 15; i++) {
    const student = students4Ter[i];
    const rawScore = 55 + ((i * 5) % 40);
    const tp = calculateMasteryLevel(rawScore);

    await prisma.scoreRecord.create({
      data: {
        studentId: student.id,
        classId: createdClasses['4 Terbilang'].id,
        subjectId: createdSubjects['MP05'].id,
        cycleId: cycle1.id,
        rawScore,
        masteryLevel: tp,
        status: 'DRAFT',
      },
    });
  }

  // 9. Initial Audit Logs
  const auditLogs = [
    {
      userId: createdUsers['admin@sekolah.edu.my'].id,
      userName: createdUsers['admin@sekolah.edu.my'].name,
      userRole: 'SUPER_ADMIN',
      action: 'SYSTEM_INIT',
      entityType: 'SYSTEM',
      entityId: school.id,
      details: JSON.stringify({ message: 'Konfigurasi awal sistem bagi Sekolah Agama Suria, Tuaran, Sabah (XCA4301) oleh Guru Besar Puan Maimunah Binti Tajuddin' }),
      ipAddress: '10.0.1.15',
    },
    {
      userId: createdUsers['penyelaras@sekolah.edu.my'].id,
      userName: createdUsers['penyelaras@sekolah.edu.my'].name,
      userRole: 'COORDINATOR',
      action: 'CYCLE_CREATE',
      entityType: 'CYCLE',
      entityId: cycle1.id,
      details: JSON.stringify({ cycle: cycle1.name, academicYear: '2026/2027', term: 1 }),
      ipAddress: '10.0.1.22',
    },
    {
      userId: createdUsers['guru.bm1@sekolah.edu.my'].id,
      userName: createdUsers['guru.bm1@sekolah.edu.my'].name,
      userRole: 'TEACHER',
      action: 'SCORE_SUBMIT',
      entityType: 'SCORE',
      entityId: createdClasses['4 Cemerlang'].id,
      details: JSON.stringify({ class: '4 Cemerlang', subject: 'MP01 - Bahasa Melayu', count: 30 }),
      ipAddress: '10.0.1.45',
    },
    {
      userId: createdUsers['kpmp.bm@sekolah.edu.my'].id,
      userName: createdUsers['kpmp.bm@sekolah.edu.my'].name,
      userRole: 'KPMP',
      action: 'SCORE_MODERATE',
      entityType: 'SCORE',
      entityId: createdClasses['4 Cemerlang'].id,
      details: JSON.stringify({ subject: 'MP01', sampleSize: 4, samplePercentage: 13.3, decision: 'APPROVED' }),
      ipAddress: '10.0.1.33',
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  // 10. Default System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'SBPPA_OFFICIAL_INTEGRATION_ENABLED', value: 'false', description: 'Status integrasi terus API rasmi SBPPA' },
      { key: 'MIN_MODERATION_SAMPLE_PERCENT', value: '10', description: 'Peratusan minimum sampel moderasi KPMP' },
      { key: 'INTERVENTION_THRESHOLD_SCORE', value: '40', description: 'Had skor mentah bagi murid memerlukan bimbingan intervensi' },
      { key: 'OFFICIAL_BANNER_NOTICE', value: 'Rekod rasmi Matriks Pembelajaran mesti dikemas kini dan disahkan melalui SBPPA mengikut prosedur rasmi KPM.', description: 'Teks peringatan integriti rasmi' },
    ],
  });

  console.log('--- Selesai Menjana Data Demo SBPPA Matriks Pembelajaran ---');
}

// Allow standalone execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((err) => {
      console.error('Ralat semasa menjana data seed:', err);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}
