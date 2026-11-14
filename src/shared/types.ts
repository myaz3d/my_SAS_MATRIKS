export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'COORDINATOR' 
  | 'TEACHER' 
  | 'KPMP' 
  | 'LEADER' 
  | 'DATA_OFFICER';

export type WorkflowStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'VALIDATED' 
  | 'MODERATED' 
  | 'APPROVED' 
  | 'EXPORT_READY' 
  | 'LOCKED';

export type ModerationDecision = 
  | 'APPROVED' 
  | 'NEEDS_CORRECTION' 
  | 'REJECTED';

export type AssessmentCycleStatus = 
  | 'DRAFT' 
  | 'ACTIVE' 
  | 'CLOSED' 
  | 'LOCKED';

export interface ScoreItem {
  id: string;
  studentId: string;
  studentMykid: string;
  studentName: string;
  studentRegNo: string;
  gender: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  cycleId: string;
  cycleName: string;
  rawScore: number | null;
  masteryLevel: number | null;
  status: WorkflowStatus;
  correctionReason?: string | null;
  isSampled: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
  submittedAt?: string | null;
  submittedBy?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  lockedAt?: string | null;
  lockedBy?: string | null;
  moderation?: {
    id: string;
    decision: ModerationDecision;
    comments?: string | null;
    moderatorName: string;
    moderatedAt: string;
  } | null;
  history?: Array<{
    id: string;
    oldRawScore: number | null;
    newRawScore: number | null;
    oldStatus: string | null;
    newStatus: string | null;
    reason: string | null;
    changedBy: string;
    changedAt: string;
  }>;
}

export interface TeacherClassSubjectAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  classId: string;
  className: string;
  gradeLevel: number;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  enteredCount: number;
  status: WorkflowStatus;
}

export interface SBPPAColumnMapping {
  schoolCode: string;
  mykid: string;
  studentName: string;
  gradeLevel: string;
  className: string;
  subjectCode: string;
  rawScore: string;
  masteryLevel: string;
  assessmentDate: string;
  verificationStatus: string;
}

export const DEFAULT_SBPPA_MAPPING: SBPPAColumnMapping = {
  schoolCode: 'KOD_SEKOLAH',
  mykid: 'NO_MYKID',
  studentName: 'NAMA_MURID',
  gradeLevel: 'TAHUN',
  className: 'KELAS',
  subjectCode: 'KOD_MP',
  rawScore: 'SKOR_MENTAH',
  masteryLevel: 'TAHAP_PENGUASAAN',
  assessmentDate: 'TARIKH_PENTAKSIRAN',
  verificationStatus: 'STATUS_SAH'
};
