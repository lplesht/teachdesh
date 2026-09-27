import { WEEKDAYS, shiftDay, toISO, weekdayName } from './dateUtils'

export type DestinationTag = 'event' | 'assignment' | 'announcement' | 'gallery' | 'general'

export interface EventMeta {
  title: string
  date: string
  dateIso?: string
  time?: string
  icon: string
  location: string
}

export interface AssignmentMeta {
  subject?: string
  text: string
  icon: string
  dateLabel: string
  dateIso?: string
  weekday?: string
}

export interface AnnouncementMeta {
  text: string
  icon: string
  dateLabel: string
}

export interface ClassificationResult {
  tags: DestinationTag[]
  events: EventMeta[]
  assignments: AssignmentMeta[]
  announcements: AnnouncementMeta[]
}

const EVENT_KEYWORDS = [
  'מסיבה',
  'אסיפה',
  'טיול',
  'חג',
  'סוכות',
  'חנוכה',
  'יום הולדת',
  'אירוע',
  'טקס',
  'הצגה',
  'מופע',
  'יום ספר פתוח',
  'פעילות',
  'ספורט יום',
]

// Study-related only: what was taught/learned, homework, tests - goes to לוח המטלות.
const ASSIGNMENT_KEYWORDS = [
  'שיעורי בית',
  'עברנו על',
  'למדנו',
  'למדתם',
  'סיכמנו',
  'תרגיל',
  'תרגילים',
  'דף עבודה',
  'עמוד',
  'עמודים',
  'להכין',
  'לתרגל',
  'לחזור על',
  'מבחן',
  'בוחן',
]

// General dated notices that are not study content and not a calendar event.
const ANNOUNCEMENT_KEYWORDS = [
  'להביא',
  'לא לשכוח',
  'תלבושת',
  'ציוד',
  'שכפ"ץ',
  'שכפץ',
  'מחברת',
  'בקבוק מים',
  'טופס',
  'לחתום',
  'תזכורת',
]

const SUBJECT_PATTERNS: { names: string[]; label: string; icon: string }[] = [
  { names: ['תנ"ך', 'תנ״ך', 'תנך'], label: 'תנ"ך', icon: '📖' },
  { names: ['חשבון', 'מתמטיקה'], label: 'חשבון', icon: '➗' },
  { names: ['אנגלית'], label: 'אנגלית', icon: '🔤' },
  { names: ['עברית'], label: 'עברית', icon: '✍️' },
  { names: ['מדעים', 'מדע'], label: 'מדעים', icon: '🔬' },
  { names: ['היסטוריה'], label: 'היסטוריה', icon: '🏛️' },
  { names: ['גיאוגרפיה'], label: 'גיאוגרפיה', icon: '🗺️' },
]

const DATE_RE = /(\d{1,2})[./](\d{1,2})/
const TIME_RE = /(\d{1,2}):(\d{2})/

function eventIcon(text: string): string {
  if (text.includes('טיול')) return '🚌'
  if (text.includes('מסיבה')) return '🎉'
  if (text.includes('אסיפה')) return '🗣️'
  if (text.includes('יום הולדת')) return '🎂'
  if (text.includes('חג') || text.includes('סוכות') || text.includes('חנוכה')) return '🍎'
  if (text.includes('הצגה') || text.includes('מופע') || text.includes('טקס')) return '🎭'
  if (text.includes('ספורט')) return '⚽'
  return '📌'
}

function extractSubject(text: string): { label: string; icon: string } | undefined {
  return SUBJECT_PATTERNS.find((s) => s.names.some((n) => text.includes(n)))
}

function assignmentIcon(text: string): string {
  const subject = extractSubject(text)
  if (subject) return subject.icon
  if (text.includes('מבחן') || text.includes('בוחן')) return '✏️'
  if (text.includes('תרגיל')) return '🧮'
  if (text.includes('דף עבודה')) return '📄'
  return '📓'
}

function announcementIcon(text: string): string {
  if (text.includes('תלבושת')) return '👕'
  if (text.includes('שכפ') || text.includes('ציוד') || text.includes('בקבוק מים')) return '🎒'
  if (text.includes('טופס') || text.includes('לחתום')) return '✍️'
  if (text.includes('מחברת')) return '📓'
  return '📌'
}

interface ResolvedDate {
  label: string
  weekday?: string
  iso?: string
}

function withDate(d: Date): ResolvedDate {
  return { label: `${d.getDate()}.${d.getMonth() + 1}`, weekday: weekdayName(d), iso: toISO(d) }
}

// Assumes the current year; rolls to next year if that would land far in the past
// (handles a date like "5.1" mentioned in December, which means next January).
function explicitDateObj(day: number, month: number, now: Date): Date {
  const year = now.getFullYear()
  let d = new Date(year, month - 1, day)
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000
  if (diffDays > 20) d = new Date(year + 1, month - 1, day)
  return d
}

// Turns relative day words into a real calendar date (based on when the message was sent),
// since assignments/events need an actual date, not just "today"/"tomorrow".
function resolveDate(text: string, now: Date): ResolvedDate {
  const dateMatch = text.match(DATE_RE)
  if (dateMatch) return withDate(explicitDateObj(parseInt(dateMatch[1], 10), parseInt(dateMatch[2], 10), now))
  if (text.includes('מחרתיים')) return withDate(shiftDay(now, 2))
  if (text.includes('מחר')) return withDate(shiftDay(now, 1))
  if (text.includes('אתמול')) return withDate(shiftDay(now, -1))
  if (text.includes('היום')) return withDate(shiftDay(now, 0))
  const day = WEEKDAYS.find((d) => text.includes(d))
  if (day) return { label: day, weekday: day }
  return { label: 'בקרוב' }
}

function truncate(text: string, max: number): string {
  const firstLine = text.split('\n')[0].trim()
  if (firstLine.length <= max) return firstLine
  return `${firstLine.slice(0, max).trim()}…`
}

// A teacher message often mixes several unrelated topics (an event, a homework
// note, a reminder) in one go - split it into per-line/per-sentence segments so
// each topic can be classified and routed on its own, instead of the whole
// message being dumped into every matching category at once. The lookahead
// keeps a decimal-looking date like "1.10" from being split mid-number.
function splitSegments(text: string): string[] {
  return text
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[^\d]|$)/))
    .map((s) => s.trim())
    .filter(Boolean)
}

export function classifyMessage(text: string, hasPhoto: boolean, sentAt: Date = new Date()): ClassificationResult {
  const tags = new Set<DestinationTag>()
  if (hasPhoto) tags.add('gallery')

  const events: EventMeta[] = []
  const assignments: AssignmentMeta[] = []
  const announcements: AnnouncementMeta[] = []

  const segments = splitSegments(text)

  for (const segment of segments) {
    const isEvent = EVENT_KEYWORDS.some((k) => segment.includes(k)) || DATE_RE.test(segment)
    const isAssignment = ASSIGNMENT_KEYWORDS.some((k) => segment.includes(k))
    const isAnnouncement = ANNOUNCEMENT_KEYWORDS.some((k) => segment.includes(k))

    if (isEvent) {
      tags.add('event')
      const timeMatch = segment.match(TIME_RE)
      const resolved = resolveDate(segment, sentAt)
      events.push({
        title: truncate(segment, 42),
        date: resolved.label,
        dateIso: resolved.iso,
        time: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined,
        icon: eventIcon(segment),
        location: 'בית הספר',
      })
    }

    if (isAssignment) {
      tags.add('assignment')
      const subject = extractSubject(segment)
      const resolved = resolveDate(segment, sentAt)
      assignments.push({
        subject: subject?.label,
        text: truncate(segment, 70),
        icon: assignmentIcon(segment),
        dateLabel: resolved.label,
        dateIso: resolved.iso,
        weekday: resolved.weekday,
      })
    }

    if (isAnnouncement) {
      tags.add('announcement')
      announcements.push({
        text: truncate(segment, 60),
        icon: announcementIcon(segment),
        dateLabel: resolveDate(segment, sentAt).label,
      })
    }
  }

  if (tags.size === 0) tags.add('general')

  return { tags: [...tags], events, assignments, announcements }
}

export const destinationLabel: Record<DestinationTag, string> = {
  event: '📅 יומן האירועים',
  assignment: '📝 מטלות כיתה ובית',
  announcement: '📌 הודעות',
  gallery: '📷 הגלריה',
  general: '🏠 עדכונים אחרונים',
}
