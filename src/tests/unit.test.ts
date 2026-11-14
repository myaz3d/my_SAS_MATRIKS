import { describe, it, expect } from 'vitest';
import { 
  validateScore, 
  calculateMasteryLevel, 
  canTransitionStatus, 
  selectRandomSample, 
  ROLE_PERMISSIONS 
} from '../shared/validation';
import { DEFAULT_SBPPA_MAPPING } from '../shared/types';

describe('1. Pengesahan Skor Mentah (Score Validation)', () => {
  it('sepatutnya menerima skor mentah sah antara 0 dan 100', () => {
    const res1 = validateScore(85);
    expect(res1.isValid).toBe(true);
    expect(res1.computedTP).toBe(6);
    expect(res1.needsIntervention).toBe(false);

    const res2 = validateScore(40);
    expect(res2.isValid).toBe(true);
    expect(res2.computedTP).toBe(3);
    expect(res2.needsIntervention).toBe(false);

    const res0 = validateScore(0);
    expect(res0.isValid).toBe(true);
    expect(res0.computedTP).toBe(1);
    expect(res0.needsIntervention).toBe(true);
  });

  it('sepatutnya menolak skor di luar julat sah (< 0 atau > 100)', () => {
    const resNeg = validateScore(-5);
    expect(resNeg.isValid).toBe(false);
    expect(resNeg.errors).toContain('Skor di luar julat sah (0 - 100)');

    const resOver = validateScore(105);
    expect(resOver.isValid).toBe(false);
    expect(resOver.errors).toContain('Skor di luar julat sah (0 - 100)');
  });

  it('sepatutnya menolak nilai bukan angka (non-numeric)', () => {
    const resNaN = validateScore('ABC' as any);
    expect(resNaN.isValid).toBe(false);
    expect(resNaN.errors).toContain('Nilai skor tidak sah (Bukan nombor)');
  });

  it('sepatutnya memberi amaran jika markah belum diisi (missing mark)', () => {
    const resEmpty = validateScore(null);
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.warnings).toContain('Skor mentah belum diisi (Missing score)');
  });

  it('sepatutnya menandakan murid yang memerlukan intervensi jika skor < 40 atau TP < 3', () => {
    const resLow = validateScore(35);
    expect(resLow.isValid).toBe(true);
    expect(resLow.computedTP).toBe(2);
    expect(resLow.needsIntervention).toBe(true);
    expect(resLow.warnings.some(w => w.includes('intervensi'))).toBe(true);
  });
});

describe('2. Pengiraan Tahap Penguasaan (Mastery Level TP)', () => {
  it('mengira TP1 hingga TP6 mengikut julat piawai KPM', () => {
    expect(calculateMasteryLevel(100)).toBe(6);
    expect(calculateMasteryLevel(85)).toBe(6);
    expect(calculateMasteryLevel(84.9)).toBe(5);
    expect(calculateMasteryLevel(70)).toBe(5);
    expect(calculateMasteryLevel(69.9)).toBe(4);
    expect(calculateMasteryLevel(55)).toBe(4);
    expect(calculateMasteryLevel(54.9)).toBe(3);
    expect(calculateMasteryLevel(40)).toBe(3);
    expect(calculateMasteryLevel(39.9)).toBe(2);
    expect(calculateMasteryLevel(20)).toBe(2);
    expect(calculateMasteryLevel(19.9)).toBe(1);
    expect(calculateMasteryLevel(0)).toBe(1);
    expect(calculateMasteryLevel(null)).toBeNull();
  });
});

describe('3. Matriks Peranan dan Kebenaran (Role & Permission Matrix)', () => {
  it('Guru Mata Pelajaran hanya boleh mengedit kelas yang ditugaskan dan tidak boleh meluluskan atau mengeksport', () => {
    const teacherPerm = ROLE_PERMISSIONS.TEACHER;
    expect(teacherPerm.canEnterScores).toBe(true);
    expect(teacherPerm.canEditAssignedOnly).toBe(true);
    expect(teacherPerm.canApproveScores).toBe(false);
    expect(teacherPerm.canExportSBPPA).toBe(false);
    expect(teacherPerm.canLockUnlock).toBe(false);
  });

  it('Ketua Panitia (KPMP) boleh menyemak dan memoderasi sampel', () => {
    const kpmpPerm = ROLE_PERMISSIONS.KPMP;
    expect(kpmpPerm.canModerateSample).toBe(true);
    expect(kpmpPerm.canExportSBPPA).toBe(false);
  });

  it('Penyelaras Matriks Pembelajaran mempunyai kebenaran menyeluruh mengurus penilaian', () => {
    const coordPerm = ROLE_PERMISSIONS.COORDINATOR;
    expect(coordPerm.canApproveScores).toBe(true);
    expect(coordPerm.canLockUnlock).toBe(true);
    expect(coordPerm.canExportSBPPA).toBe(true);
    expect(coordPerm.canModerateSample).toBe(true);
  });

  it('Pegawai Data boleh mengurus roster dan menjana fail eksport sahaja', () => {
    const dataPerm = ROLE_PERMISSIONS.DATA_OFFICER;
    expect(dataPerm.canEnterScores).toBe(false);
    expect(dataPerm.canManageRoster).toBe(true);
    expect(dataPerm.canExportSBPPA).toBe(true);
  });
});

describe('4. Peralihan Aliran Kerja (Workflow Status Transitions)', () => {
  it('membenarkan Guru menukar DRAFT kepada SUBMITTED', () => {
    const check = canTransitionStatus('DRAFT', 'SUBMITTED', 'TEACHER');
    expect(check.allowed).toBe(true);
  });

  it('menghalang Guru melompat terus dari DRAFT ke APPROVED', () => {
    const check = canTransitionStatus('DRAFT', 'APPROVED', 'TEACHER');
    expect(check.allowed).toBe(false);
  });

  it('membenarkan KPMP memoderasi rekod daripada VALIDATED kepada MODERATED', () => {
    const check = canTransitionStatus('VALIDATED', 'MODERATED', 'KPMP');
    expect(check.allowed).toBe(true);
  });

  it('menghalang pengubahsuaian terus apabila rekod berstatus LOCKED tanpa buka kunci', () => {
    const check = canTransitionStatus('LOCKED', 'DRAFT', 'TEACHER');
    expect(check.allowed).toBe(false);
  });
});

describe('5. Penjana Sampel Rawak Moderasi KPMP (Random Sampling >= 10%)', () => {
  it('menjamin sekurang-kurangnya 10% sampel rawak dipilih daripada rekod murid', () => {
    const mockRecords = Array.from({ length: 30 }, (_, i) => ({ id: `rec-${i}`, score: 60 + i }));
    const sample = selectRandomSample(mockRecords, 10);

    // 10% of 30 is 3
    expect(sample.length).toBeGreaterThanOrEqual(3);
    expect(sample.length).toBe(3);

    // Ensure all sampled elements are distinct
    const ids = new Set(sample.map(s => s.id));
    expect(ids.size).toBe(sample.length);
  });

  it('mengendalikan senarai kecil atau 1 rekod dengan memilih sekurang-kurangnya 1', () => {
    const singleRecord = [{ id: 'rec-1', score: 75 }];
    const sample = selectRandomSample(singleRecord, 10);
    expect(sample.length).toBe(1);
  });
});

describe('6. Konfigurasi Lajur SBPPA (SBPPA Column Mapping)', () => {
  it('mempunyai pemetaan lalai yang lengkap mengikut spesifikasi SBPPA KPM', () => {
    expect(DEFAULT_SBPPA_MAPPING.schoolCode).toBe('KOD_SEKOLAH');
    expect(DEFAULT_SBPPA_MAPPING.mykid).toBe('NO_MYKID');
    expect(DEFAULT_SBPPA_MAPPING.studentName).toBe('NAMA_MURID');
    expect(DEFAULT_SBPPA_MAPPING.rawScore).toBe('SKOR_MENTAH');
    expect(DEFAULT_SBPPA_MAPPING.masteryLevel).toBe('TAHAP_PENGUASAAN');
  });
});
