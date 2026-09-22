import type { DestinationTag } from './classify'

export type Role = 'parent' | 'teacher'
export type TabId = 'home' | 'calendar' | 'board' | 'announcements' | 'gallery'

export interface ClassInfo {
  className: string
  schoolName: string
  teacherName: string
  teacherInitials: string
}

export interface ChatMessage {
  id: string
  from: 'teacher' | 'parent'
  authorName: string
  text: string
  time: string
  likes: number
  readBy: number
  photoUrl?: string
  tags: DestinationTag[]
}

export interface EventCard {
  id: string
  title: string
  date: string
  time?: string
  location: string
  icon: string
  rsvpYes: number
  rsvpNo: number
  myRsvp: 'yes' | 'no' | null
  sourceMessageId?: string
}

export interface AssignmentCard {
  id: string
  subject?: string
  text: string
  icon: string
  dateLabel: string
  sourceMessageId?: string
}

export interface AnnouncementCard {
  id: string
  text: string
  icon: string
  dateLabel: string
  sourceMessageId?: string
}

export interface Photo {
  id: string
  caption: string
  date: string
  gradient: string
  emoji: string
  imageUrl?: string
  sourceMessageId?: string
}

export const classInfo: ClassInfo = {
  className: 'ג׳ 4',
  schoolName: 'בית ספר יסודי "הדקל"',
  teacherName: 'תהילה שם טוב',
  teacherInitials: 'תש',
}

export const initialStudents: string[] = [
  'יונתן כהן', 'נועה לוי', 'איתי מזרחי', 'שירה אברהם', 'עומר פרץ', 'מאיה בן דוד',
  'דניאל אוחיון', 'תמר גבאי', 'רועי אזולאי', 'הילה דהן', 'עידו נחום', 'אביגיל מלכה',
  'יהלי שושן', 'ליה חדד', 'נדב יוסף', 'רוני עמר', 'אור כץ', 'שקד ביטון',
  'עדן וקנין', 'גל אשכנזי', 'טליה סבג', 'ארז פרידמן', 'נויה חן', 'אלון ששון',
  'מיכל בוזגלו', 'יובל שרעבי', 'זיו קורן',
]

export const initialMessages: ChatMessage[] = [
  {
    id: 'c1',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'ערב טוב להורים היקרים! רק רציתי לספר שהילדים היו מדהימים היום בחזרות למופע 🎭',
    time: '18:42',
    likes: 14,
    readBy: 24,
    tags: ['event'],
  },
  {
    id: 'c2',
    from: 'parent',
    authorName: 'אמא של יונתן',
    text: 'איזה כיף לשמוע! תודה על העדכון 🙏',
    time: '18:45',
    likes: 3,
    readBy: 0,
    tags: ['general'],
  },
  {
    id: 'c3',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'תזכורת - מחר להביא בקבוק מים ושכפ"ץ, יוצאים לחצר לשיעור ספורט 💧',
    time: '18:47',
    likes: 9,
    readBy: 21,
    tags: ['announcement'],
  },
  {
    id: 'c4',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'טופס הסכמה לטיול השנתי - אנא מלאו באתר עד יום חמישי. הטיול ב-1.10 לגן החיות בתל אביב 🦁',
    time: 'היום, 09:12',
    likes: 11,
    readBy: 22,
    tags: ['event', 'announcement'],
  },
  {
    id: 'c5',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'היום בתנ״ך למדנו על משה ואהרון עמודים 51-58',
    time: 'היום, 10:20',
    likes: 6,
    readBy: 19,
    tags: ['assignment'],
  },
]

export const initialEvents: EventCard[] = [
  {
    id: 'e1',
    title: 'חזרות למופע הכיתתי',
    date: 'בקרוב',
    location: 'בית הספר',
    icon: '🎭',
    rsvpYes: 0,
    rsvpNo: 0,
    myRsvp: null,
    sourceMessageId: 'c1',
  },
  {
    id: 'e2',
    title: 'טיול שנתי - גן החיות בתל אביב',
    date: '1.10',
    location: 'בית הספר',
    icon: '🚌',
    rsvpYes: 22,
    rsvpNo: 1,
    myRsvp: 'yes',
    sourceMessageId: 'c4',
  },
  {
    id: 'e3',
    title: 'אסיפת הורים',
    date: '24.9',
    time: '18:00',
    location: 'כיתה ג׳ 4',
    icon: '🗣️',
    rsvpYes: 18,
    rsvpNo: 2,
    myRsvp: null,
  },
]

export const initialAssignments: AssignmentCard[] = [
  {
    id: 'a1',
    subject: 'תנ"ך',
    text: 'למדנו על משה ואהרון, עמודים 51-58',
    icon: '📖',
    dateLabel: '22.9',
    sourceMessageId: 'c5',
  },
]

export const initialAnnouncements: AnnouncementCard[] = [
  {
    id: 'n1',
    text: 'מחר להביא בקבוק מים ושכפ"ץ, יוצאים לחצר לשיעור ספורט 💧',
    icon: '🎒',
    dateLabel: 'מחר',
    sourceMessageId: 'c3',
  },
  {
    id: 'n2',
    text: 'טופס הסכמה לטיול השנתי - יש למלא באתר עד יום חמישי',
    icon: '✍️',
    dateLabel: 'עד יום חמישי',
    sourceMessageId: 'c4',
  },
]

export const dutyRoster = [
  { day: 'ראשון', parent: 'משפחת כהן', task: 'חטיף בריא' },
  { day: 'שני', parent: 'משפחת לוי', task: 'ליווי לספרייה' },
  { day: 'שלישי', parent: 'משפחת מזרחי', task: 'חטיף בריא' },
  { day: 'רביעי', parent: 'משפחת אברהם', task: 'עזרה בהפסקה' },
  { day: 'חמישי', parent: 'משפחת פרץ', task: 'חטיף בריא' },
]

export const initialPhotos: Photo[] = [
  { id: 'p1', caption: 'יום יצירה בכיתה', date: '12.9', gradient: 'from-sun-300 to-sun-500', emoji: '🎨' },
  { id: 'p2', caption: 'ניסוי מדעים - הר געש', date: '10.9', gradient: 'from-leaf-400 to-brand-500', emoji: '🌋' },
  { id: 'p3', caption: 'הפסקה פעילה בחצר', date: '8.9', gradient: 'from-brand-300 to-brand-600', emoji: '⚽' },
  { id: 'p4', caption: 'קריאה בפינת הספרים', date: '5.9', gradient: 'from-sun-200 to-sun-400', emoji: '📚' },
]
