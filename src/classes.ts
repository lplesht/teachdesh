export interface ClassInfo {
  id: string
  className: string
  schoolName: string
  teacherName: string
  teacherInitials: string
}

// Known up front for the pilot (just 2 classes) - kept in code rather than
// Firestore so listing them costs no extra read. Replace the placeholder
// values for the second class once they're decided.
export const CLASSES: Record<string, ClassInfo> = {
  g4: {
    id: 'g4',
    className: 'ג׳ 4',
    schoolName: 'בית ספר יסודי "הרצוג"',
    teacherName: 'תהילה שם טוב',
    teacherInitials: 'תש',
  },
  class2: {
    id: 'class2',
    className: '(כיתה שנייה - למלא)',
    schoolName: '(שם בית ספר - למלא)',
    teacherName: '(שם מורה - למלא)',
    teacherInitials: '??',
  },
}
