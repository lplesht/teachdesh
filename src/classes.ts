export interface ClassInfo {
  id: string
  // The short number a parent/teacher types on the login screen instead of
  // picking from a list - simpler to hand out verbally than a full class id.
  number: number
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
    number: 1,
    className: 'ב׳ 1',
    schoolName: 'בית ספר יסודי הרצוג',
    teacherName: 'אדום מטודי',
    teacherInitials: 'אמ',
  },
  g4: {
    id: 'g4',
    number: 2,
    className: 'ג׳ 4',
    schoolName: 'בית ספר יסודי הרצוג',
    teacherName: 'תהילה שם טוב',
    teacherInitials: 'תש',
  },
}

export function findClassByNumber(number: number): ClassInfo | undefined {
  return Object.values(CLASSES).find((c) => c.number === number)
}
