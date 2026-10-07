export interface ClassInfo {
  id: string
  className: string
  schoolName: string
  teacherName: string
  teacherInitials: string
}

// Known up front for the pilot (just 2 classes) - kept in code rather than
// Firestore so listing them costs no extra read.
export const CLASSES: Record<string, ClassInfo> = {
  b1: {
    id: 'b1',
    className: 'ב׳ 1',
    schoolName: 'בית ספר יסודי הרצוג',
    teacherName: 'אדום מטודי',
    teacherInitials: 'אמ',
  },
  g4: {
    id: 'g4',
    className: 'ג׳ 4',
    schoolName: 'בית ספר יסודי הרצוג',
    teacherName: 'תהילה שם טוב',
    teacherInitials: 'תש',
  },
}

// The login screen first asks for a school, then lists that school's classes.
export function listSchools(): string[] {
  return [...new Set(Object.values(CLASSES).map((c) => c.schoolName))]
}

export function classesOfSchool(schoolName: string): ClassInfo[] {
  return Object.values(CLASSES).filter((c) => c.schoolName === schoolName)
}
