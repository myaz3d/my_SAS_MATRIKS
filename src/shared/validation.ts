import { UserRole, WorkflowStatus } from './types';

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  computedTP: number | null;
  needsIntervention: boolean;
}

/**
 * Calculates Tahap Penguasaan (TP1-TP6) based on KPM standard raw score bands
 */
export function calculateMasteryLevel(rawScore: number | null | undefined): number | null {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) {
    return null;
  }
  if (rawScore >= 85) return 6;
  if (rawScore >= 70) return 5;
  if (rawScore >= 55) return 4;
  if (rawScore >= 40) return 3;
  if (rawScore >= 20) return 2;
  if (rawScore >= 0) return 1;
  return null;
}

export function getMasteryLabel(tp: number | null): string {
  switch (tp) {
    case 6: return 'TP6 - Cemerlang';
    case 5: return 'TP5 - Sangat Baik';
    case 4: return 'TP4 - Baik';
    case 3: return 'TP3 - Memuaskan (Tahap Minimum)';
    case 2: return 'TP2 - Perlu Bimbingan';
    case 1: return 'TP1 - Perlu Bimbingan Rapi';
    default: return 'Tiada Skor';
  }
}

/**
 * Validates a single raw score against KPM boundary criteria
 */
export function validateScore(
  rawScore: number | null | undefined, 
  minScore = 0, 
  maxScore = 100
): ScoreValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rawScore === null || rawScore === undefined || rawScore.toString().trim() === '') {
    warnings.push('Skor mentah belum diisi (Missing score)');
    return {
      isValid: false,
      errors: [],
      warnings,
      computedTP: null,
      needsIntervention: false,
    };
  }

  const num = Number(rawScore);

  if (isNaN(num)) {
    errors.push('Nilai skor tidak sah (Bukan nombor)');
    return {
      isValid: false,
      errors,
      warnings,
      computedTP: null,
      needsIntervention: false,
    };
  }

  if (num < minScore || num > maxScore) {
    errors.push(`Skor di luar julat sah (${minScore} - ${maxScore})`);
  }

  // Check decimal precision (at most 1 decimal place allowed in standard KPM instruments)
  const decimalParts = num.toString().split('.');
  if (decimalParts.length > 1 && decimalParts[1].length > 1) {
    warnings.push('Format markah melebihi 1 tempat perpuluhan');
  }

  const computedTP = calculateMasteryLevel(num);
  const needsIntervention = num < 40 || (computedTP !== null && computedTP < 3);

  if (needsIntervention) {
    warnings.push('Murid memerlukan bimbingan intervensi (Skor < 40 / Bawah TP3)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    computedTP,
    needsIntervention,
  };
}

/**
 * Role-Based Permissions Matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, {
  canEnterScores: boolean;
  canEditAssignedOnly: boolean;
  canSubmitScores: boolean;
  canModerateSample: boolean;
  canApproveScores: boolean;
  canLockUnlock: boolean;
  canManageRoster: boolean;
  canExportSBPPA: boolean;
  canViewAuditLogs: boolean;
  canConfigureIntegration: boolean;
}> = {
  SUPER_ADMIN: {
    canEnterScores: true,
    canEditAssignedOnly: false,
    canSubmitScores: true,
    canModerateSample: true,
    canApproveScores: true,
    canLockUnlock: true,
    canManageRoster: true,
    canExportSBPPA: true,
    canViewAuditLogs: true,
    canConfigureIntegration: true,
  },
  COORDINATOR: {
    canEnterScores: true,
    canEditAssignedOnly: false,
    canSubmitScores: true,
    canModerateSample: true,
    canApproveScores: true,
    canLockUnlock: true,
    canManageRoster: true,
    canExportSBPPA: true,
    canViewAuditLogs: true,
    canConfigureIntegration: false,
  },
  TEACHER: {
    canEnterScores: true,
    canEditAssignedOnly: true,
    canSubmitScores: true,
    canModerateSample: false,
    canApproveScores: false,
    canLockUnlock: false,
    canManageRoster: false,
    canExportSBPPA: false,
    canViewAuditLogs: false,
    canConfigureIntegration: false,
  },
  KPMP: {
    canEnterScores: true,
    canEditAssignedOnly: true, // For own classes
    canSubmitScores: true,
    canModerateSample: true,   // For subject panitia
    canApproveScores: false,
    canLockUnlock: false,
    canManageRoster: false,
    canExportSBPPA: false,
    canViewAuditLogs: true,
    canConfigureIntegration: false,
  },
  LEADER: {
    canEnterScores: false,
    canEditAssignedOnly: false,
    canSubmitScores: false,
    canModerateSample: false,
    canApproveScores: true,
    canLockUnlock: false,
    canManageRoster: false,
    canExportSBPPA: true,
    canViewAuditLogs: true,
    canConfigureIntegration: false,
  },
  DATA_OFFICER: {
    canEnterScores: false,
    canEditAssignedOnly: false,
    canSubmitScores: false,
    canModerateSample: false,
    canApproveScores: false,
    canLockUnlock: false,
    canManageRoster: true,
    canExportSBPPA: true,
    canViewAuditLogs: true,
    canConfigureIntegration: false,
  },
};

/**
 * Validates workflow status transitions
 */
export function canTransitionStatus(
  currentStatus: WorkflowStatus, 
  targetStatus: WorkflowStatus, 
  role: UserRole
): { allowed: boolean; reason?: string } {
  if (role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  switch (currentStatus) {
    case 'DRAFT':
      if (targetStatus === 'SUBMITTED') {
        if (role === 'TEACHER' || role === 'KPMP' || role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya guru mata pelajaran atau penyelaras boleh menghantar rekod.' };
      }
      return { allowed: false, reason: 'Rekod draf hanya boleh dihantar untuk semakan.' };

    case 'SUBMITTED':
      if (targetStatus === 'VALIDATED') {
        if (role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya Penyelaras MP boleh mengesahkan format rekod dihantar.' };
      }
      if (targetStatus === 'DRAFT') {
        if (role === 'COORDINATOR' || role === 'TEACHER') return { allowed: true };
        return { allowed: false, reason: 'Pengembalian ke Draf memerlukan kebenaran.' };
      }
      return { allowed: false, reason: 'Peralihan tidak sah dari status Dihantar.' };

    case 'VALIDATED':
      if (targetStatus === 'MODERATED') {
        if (role === 'KPMP' || role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya KPMP atau Penyelaras boleh melaksanakan moderasi.' };
      }
      return { allowed: false, reason: 'Peralihan tidak sah dari status Disemak.' };

    case 'MODERATED':
      if (targetStatus === 'APPROVED') {
        if (role === 'COORDINATOR' || role === 'LEADER') return { allowed: true };
        return { allowed: false, reason: 'Hanya Penyelaras atau Pihak Pengurusan Sekolah boleh meluluskan rekod.' };
      }
      if (targetStatus === 'DRAFT') {
        if (role === 'KPMP' || role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya KPMP/Penyelaras boleh mengembalikan ke Draf untuk pembetulan.' };
      }
      return { allowed: false, reason: 'Peralihan tidak sah dari status Dimoderasi.' };

    case 'APPROVED':
      if (targetStatus === 'EXPORT_READY') {
        if (role === 'COORDINATOR' || role === 'DATA_OFFICER') return { allowed: true };
        return { allowed: false, reason: 'Hanya Penyelaras atau Pegawai Data boleh menandakan Sedia Eksport.' };
      }
      if (targetStatus === 'LOCKED') {
        if (role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya Penyelaras atau Pentadbir boleh mengunci rekod.' };
      }
      return { allowed: false, reason: 'Peralihan tidak sah dari status Diluluskan.' };

    case 'EXPORT_READY':
      if (targetStatus === 'LOCKED') {
        if (role === 'COORDINATOR') return { allowed: true };
        return { allowed: false, reason: 'Hanya Penyelaras atau Pentadbir boleh mengunci rekod.' };
      }
      return { allowed: false, reason: 'Peralihan tidak sah dari status Sedia Eksport.' };

    case 'LOCKED':
      // Unlock requires admin or coordinator with justification
      return { allowed: false, reason: 'Rekod telah dikunci. Buka kunci memerlukan permohonan khas pentadbir.' };

    default:
      return { allowed: false, reason: 'Status tidak dikenali.' };
  }
}

/**
 * Random sample selector for KPMP Moderation (guarantees >= 10% sample)
 */
export function selectRandomSample<T>(records: T[], samplePercentage = 10): T[] {
  if (records.length === 0) return [];
  const minRequired = Math.max(1, Math.ceil(records.length * (Math.max(10, samplePercentage) / 100)));
  const shuffled = [...records].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, minRequired);
}
