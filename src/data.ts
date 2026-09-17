export type Role = 'parent' | 'teacher'

export interface ClassInfo {
  className: string
  schoolName: string
  teacherName: string
  teacherInitials: string
  studentsCount: number
  presentToday: number
}

export interface Announcement {
  id: string
  title: string
  body: string
  time: string
  pinned?: boolean
  tag: 'הודעה' | 'תזכורת' | 'דחוף'
}

export interface Photo {
  id: string
  caption: string
  date: string
  gradient: string
  emoji: string
}

export interface ChatMessage {
  id: string
  from: 'teacher' | 'parent'
  authorName: string
  text: string
  time: string
  likes: number
  readBy: number
}

export interface SchoolEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  icon: string
  rsvpYes: number
  rsvpNo: number
  myRsvp: 'yes' | 'no' | null
}

export const classInfo: ClassInfo = {
  className: 'ג׳ 4',
  schoolName: 'בית ספר יסודי "הדקל"',
  teacherName: 'תהילה שם טוב',
  teacherInitials: 'תש',
  studentsCount: 27,
  presentToday: 25,
}

export const initialAnnouncements: Announcement[] = [
  {
    id: 'a1',
    title: 'מחר יום הבגדים המצחיקים 🤪',
    body: 'תזכורת חמודה - מחר מגיעים עם בגדים הפוכים או מצחיקים לרגל סיום היחידה בשיעור חברה. בואו נצחק ביחד!',
    time: 'לפני 20 דקות',
    pinned: true,
    tag: 'תזכורת',
  },
  {
    id: 'a2',
    title: 'טופס הסכמה לטיול השנתי',
    body: 'אנא מלאו את הטופס באתר עד יום חמישי. הטיול יתקיים בעוד שבועיים לגן החיות בתל אביב.',
    time: 'לפני 3 שעות',
    tag: 'דחוף',
  },
  {
    id: 'a3',
    title: 'שינוי בשיעורי הבית להיום',
    body: 'במקום דף עבודה במתמטיקה - קריאה חופשית של 20 דקות מהספר האישי. תהנו!',
    time: 'היום, 13:10',
    tag: 'הודעה',
  },
  {
    id: 'a4',
    title: 'תודה לכל ההורים שהתנדבו',
    body: 'יום הספורט עבר נהדר בזכות ההורים שעזרו בתחנות. הילדים נהנו מאוד ❤️',
    time: 'אתמול',
    tag: 'הודעה',
  },
]

export const initialPhotos: Photo[] = [
  { id: 'p1', caption: 'יום יצירה בכיתה', date: '12.9', gradient: 'from-sun-300 to-sun-500', emoji: '🎨' },
  { id: 'p2', caption: 'ניסוי מדעים - הר געש', date: '10.9', gradient: 'from-leaf-400 to-brand-500', emoji: '🌋' },
  { id: 'p3', caption: 'הפסקה פעילה בחצר', date: '8.9', gradient: 'from-brand-300 to-brand-600', emoji: '⚽' },
  { id: 'p4', caption: 'קריאה בפינת הספרים', date: '5.9', gradient: 'from-sun-200 to-sun-400', emoji: '📚' },
  { id: 'p5', caption: 'מסיבת יום הולדת כיתתית', date: '3.9', gradient: 'from-brand-400 to-leaf-500', emoji: '🎂' },
  { id: 'p6', caption: 'טיול לגינה הקהילתית', date: '1.9', gradient: 'from-leaf-500 to-brand-400', emoji: '🌻' },
]

export const initialChat: ChatMessage[] = [
  {
    id: 'c1',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'ערב טוב להורים היקרים! רק רציתי לספר שהילדים היו מדהימים היום בחזרות למופע 🎭',
    time: '18:42',
    likes: 14,
    readBy: 24,
  },
  {
    id: 'c2',
    from: 'parent',
    authorName: 'אמא של יונתן',
    text: 'איזה כיף לשמוע! תודה על העדכון 🙏',
    time: '18:45',
    likes: 3,
    readBy: 0,
  },
  {
    id: 'c3',
    from: 'teacher',
    authorName: 'תהילה שם טוב',
    text: 'בשמחה! תזכורת - מחר להביא בקבוק מים ושכפ"ץ, יוצאים לחצר לשיעור ספורט 💧',
    time: '18:47',
    likes: 9,
    readBy: 21,
  },
]

export const initialEvents: SchoolEvent[] = [
  {
    id: 'e1',
    title: 'אסיפת הורים',
    date: '24.9',
    time: '18:00',
    location: 'כיתה ג׳ 4',
    icon: '🗣️',
    rsvpYes: 18,
    rsvpNo: 2,
    myRsvp: null,
  },
  {
    id: 'e2',
    title: 'טיול שנתי - גן החיות',
    date: '1.10',
    time: '08:00',
    location: 'יציאה מהחניה המרכזית',
    icon: '🦁',
    rsvpYes: 22,
    rsvpNo: 1,
    myRsvp: 'yes',
  },
  {
    id: 'e3',
    title: 'מסיבת סוכות כיתתית',
    date: '5.10',
    time: '10:30',
    location: 'סוכת בית הספר',
    icon: '🍎',
    rsvpYes: 15,
    rsvpNo: 0,
    myRsvp: null,
  },
]

export const dutyRoster = [
  { day: 'ראשון', parent: 'משפחת כהן', task: 'חטיף בריא' },
  { day: 'שני', parent: 'משפחת לוי', task: 'ליווי לספרייה' },
  { day: 'שלישי', parent: 'משפחת מזרחי', task: 'חטיף בריא' },
  { day: 'רביעי', parent: 'משפחת אברהם', task: 'עזרה בהפסקה' },
  { day: 'חמישי', parent: 'משפחת פרץ', task: 'חטיף בריא' },
]
