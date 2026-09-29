import type { DestinationTag } from './classify'

export type Role = 'parent' | 'teacher'
export type TabId = 'home' | 'calendar' | 'board' | 'announcements' | 'gallery'

export interface ChatMessage {
  id: string
  from: 'teacher' | 'parent'
  authorName: string
  text: string
  time: string
  ts: number
  likes: number
  likedBy: Record<string, string> // phone -> displayName, for who-liked-this + this viewer's own like state
  readBy: number
  photoUrl?: string
  tags: DestinationTag[]
}

export interface EventCard {
  id: string
  title: string
  date: string
  dateIso?: string
  time?: string
  location: string
  icon: string
  rsvpYes: number
  rsvpNo: number
  myRsvp: 'yes' | 'no' | null
  sourceMessageId?: string
  ts: number
}

export interface AssignmentCard {
  id: string
  subject: string
  source?: string
  pages?: string
  content: string
  icon: string
  // The day the assignment was *given* (derived from the message's send
  // time), used to group same-day assignments into one bubble - not a due
  // date, which assignments no longer carry.
  dayIso: string
  dayLabel: string
  weekday: string
  ts: number
  sourceMessageId?: string
}

export interface HolidayEvent {
  id: string
  title: string
  startDate: string
  endDate?: string
  icon: string
  kind: 'holiday' | 'vacation'
}

export interface AnnouncementCard {
  id: string
  text: string
  icon: string
  // The day the announcement was *sent* (from the message's send time),
  // used to group same-day announcements into one bubble - not any due
  // date mentioned in the text itself (e.g. "bring this by tomorrow").
  dayIso: string
  dayLabel: string
  weekday: string
  ts: number
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
    ts: new Date('2026-09-20T18:42:00').getTime(),
    likes: 14,
    likedBy: {},
    readBy: 24,
    tags: ['event'],
  },
  {
    id: 'c2',
    from: 'parent',
    authorName: 'אמא של יונתן',
    text: 'איזה כיף לשמוע! תודה על העדכון 🙏',
    time: '18:45',
    ts: new Date('2026-09-20T18:45:00').getTime(),
    likes: 3,
    likedBy: {},
    readBy: 0,
    tags: ['general'],
  },
  {
    id: 'c3',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'תזכורת - מחר להביא בקבוק מים ושכפ"ץ, יוצאים לחצר לשיעור ספורט 💧',
    time: '18:47',
    ts: new Date('2026-09-20T18:47:00').getTime(),
    likes: 9,
    likedBy: {},
    readBy: 21,
    tags: ['announcement'],
  },
  {
    id: 'c4',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'טופס הסכמה לטיול השנתי - אנא מלאו באתר עד יום חמישי. הטיול ב-1.10 לגן החיות בתל אביב 🦁',
    time: 'היום, 09:12',
    ts: new Date('2026-09-21T09:12:00').getTime(),
    likes: 11,
    likedBy: {},
    readBy: 22,
    tags: ['event', 'announcement'],
  },
  {
    id: 'c5',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'היום בתנ״ך למדנו על משה ואהרון עמודים 51-58',
    time: 'היום, 10:20',
    ts: new Date('2026-09-22T10:20:00').getTime(),
    likes: 6,
    likedBy: {},
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
    ts: new Date('2026-09-20T18:42:00').getTime(),
  },
  {
    id: 'e2',
    title: 'טיול שנתי - גן החיות בתל אביב',
    date: '1.10',
    dateIso: '2026-10-01',
    location: 'בית הספר',
    icon: '🚌',
    rsvpYes: 22,
    rsvpNo: 1,
    myRsvp: 'yes',
    sourceMessageId: 'c4',
    ts: new Date('2026-09-21T09:12:00').getTime(),
  },
  {
    id: 'e3',
    title: 'אסיפת הורים',
    date: '24.9',
    dateIso: '2026-09-24',
    time: '18:00',
    location: 'כיתה ג׳ 4',
    icon: '🗣️',
    rsvpYes: 18,
    rsvpNo: 2,
    myRsvp: null,
    ts: new Date('2026-09-18T08:00:00').getTime(),
  },
]

export const initialAssignments: AssignmentCard[] = [
  {
    id: 'a1',
    subject: 'תנ"ך',
    source: 'ספר - ספר התנ"ך',
    pages: '51-58',
    content: 'למדנו על משה ואהרון, עמודים 51-58',
    icon: '📖',
    dayIso: '2026-09-22',
    dayLabel: '22.9',
    weekday: 'יום שלישי',
    ts: new Date('2026-09-22T10:20:00').getTime(),
    sourceMessageId: 'c5',
  },
]

// Israeli school-year holidays & vacations (5787 / 2026-2027), sourced dates.
export const israeliHolidays: HolidayEvent[] = [
  { id: 'h1', title: 'ראש השנה', startDate: '2026-09-11', endDate: '2026-09-13', icon: '🍯', kind: 'vacation' },
  { id: 'h2', title: 'יום כיפור', startDate: '2026-09-21', icon: '🕊️', kind: 'holiday' },
  { id: 'h3', title: 'חופשת סוכות (כיפור-סוכות-שמח"ת)', startDate: '2026-09-20', endDate: '2026-10-03', icon: '🌿', kind: 'vacation' },
  { id: 'h4', title: 'סוכות (חג)', startDate: '2026-09-26', icon: '🌿', kind: 'holiday' },
  { id: 'h5', title: 'שמחת תורה', startDate: '2026-10-03', icon: '📜', kind: 'holiday' },
  { id: 'h6', title: 'חנוכה (נר ראשון)', startDate: '2026-12-04', icon: '🕎', kind: 'holiday' },
  { id: 'h7', title: 'חופשת חנוכה', startDate: '2026-12-06', endDate: '2026-12-12', icon: '🕎', kind: 'vacation' },
  { id: 'h8', title: 'ט"ו בשבט', startDate: '2027-01-22', icon: '🌳', kind: 'holiday' },
  { id: 'h9', title: 'חופשת פורים', startDate: '2027-03-23', endDate: '2027-03-24', icon: '🎭', kind: 'vacation' },
  { id: 'h10', title: 'חופשת פסח', startDate: '2027-04-13', endDate: '2027-04-28', icon: '🍷', kind: 'vacation' },
  { id: 'h11', title: 'יום הזיכרון', startDate: '2027-05-11', icon: '🕯️', kind: 'holiday' },
  { id: 'h12', title: 'יום העצמאות', startDate: '2027-05-12', icon: '🇮🇱', kind: 'vacation' },
  { id: 'h13', title: 'חופשת שבועות', startDate: '2027-06-10', endDate: '2027-06-11', icon: '🌾', kind: 'vacation' },
  { id: 'h14', title: 'סיום שנת הלימודים (משוער)', startDate: '2027-06-20', icon: '🎓', kind: 'vacation' },
]

export const initialAnnouncements: AnnouncementCard[] = [
  {
    id: 'n1',
    text: 'מחר להביא בקבוק מים ושכפ"ץ, יוצאים לחצר לשיעור ספורט 💧',
    icon: '🎒',
    dayIso: '2026-09-22',
    dayLabel: '22.9',
    weekday: 'יום שלישי',
    ts: new Date('2026-09-22T18:47:00').getTime(),
    sourceMessageId: 'c3',
  },
  {
    id: 'n2',
    text: 'טופס הסכמה לטיול השנתי - יש למלא באתר עד יום חמישי',
    icon: '✍️',
    dayIso: '2026-09-23',
    dayLabel: '23.9',
    weekday: 'יום רביעי',
    ts: new Date('2026-09-23T09:12:00').getTime(),
    sourceMessageId: 'c4',
  },
]

export const initialPhotos: Photo[] = [
  { id: 'p1', caption: 'יום יצירה בכיתה', date: '12.9', gradient: 'from-sun-300 to-sun-500', emoji: '🎨' },
  { id: 'p2', caption: 'ניסוי מדעים - הר געש', date: '10.9', gradient: 'from-leaf-400 to-brand-500', emoji: '🌋' },
  { id: 'p3', caption: 'הפסקה פעילה בחצר', date: '8.9', gradient: 'from-brand-300 to-brand-600', emoji: '⚽' },
  { id: 'p4', caption: 'קריאה בפינת הספרים', date: '5.9', gradient: 'from-sun-200 to-sun-400', emoji: '📚' },
]
