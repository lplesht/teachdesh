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
  subject: string
  source?: string
  content: string
  icon: string
  dateLabel: string
  dateIso?: string
  weekday?: string
}

export const GENERAL_SUBJECT = '(כללי)'

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
  engine: 'gemini' | 'rules'
}

// Grouped so different spellings/forms of the same concept ("חופשה"/"חופש")
// are deduped together - a vacation mentioned twice in one message should
// still only produce one calendar event, not one per wording.
const EVENT_KEYWORD_GROUPS: (string | RegExp)[][] = [
  ['מסיבה'],
  ['אסיפה'],
  ['טיול'],
  ['יום הולדת'],
  ['אירוע'],
  [/טקס(?!ט)/], // "ceremony", but not as a prefix of "טקסט" (text)
  ['הצגה'],
  ['מופע'],
  ['יום ספר פתוח'],
  ['פעילות'],
  ['ספורט יום'],
  // A holiday/vacation notice tends to say the same thing several different
  // ways in one message (חג, סוכות, חנוכה, חופשה) plus a separate "we're
  // back on X" line - all one topic, not one event per phrasing.
  ['חג', 'סוכות', 'חנוכה', 'חופשה', 'חופש', 'נחזור לשגרה', 'חוזרים לבית הספר'],
]

function matchesKeyword(line: string, keyword: string | RegExp): boolean {
  return typeof keyword === 'string' ? line.includes(keyword) : keyword.test(line)
}

// Shared by both the rule-based classifier and the LLM-based one: tags are
// derived from which arrays actually got entries, plus whether a photo was
// attached, falling back to "general" (chat-only, no cube) when nothing matched.
//
// TEMPORARY (per request): nothing routes to the calendar right now - fold
// anything that would've been an event into הודעות instead. Revert by
// restoring the commented-out lines below once calendar routing is revisited.
export function finalizeResult(
  hasPhoto: boolean,
  events: EventMeta[],
  assignments: AssignmentMeta[],
  announcements: AnnouncementMeta[],
  engine: 'gemini' | 'rules',
): ClassificationResult {
  const redirectedAnnouncements = [
    ...announcements,
    ...events.map((e): AnnouncementMeta => ({ text: e.title, icon: e.icon, dateLabel: e.date })),
  ]

  const tags = new Set<DestinationTag>()
  if (hasPhoto) tags.add('gallery')
  // if (events.length > 0) tags.add('event')
  if (assignments.length > 0) tags.add('assignment')
  if (redirectedAnnouncements.length > 0) tags.add('announcement')
  if (tags.size === 0) tags.add('general')
  return { tags: [...tags], events: [], assignments, announcements: redirectedAnnouncements, engine }
}

// Study-related only: what was taught/learned, homework, tests - goes to לוח המטלות.
const ASSIGNMENT_KEYWORDS = [
  'שיעורי בית',
  'עברנו על',
  'למדנו',
  'למדתם',
  'סיכמנו',
  'תרגיל',
  'תרגילים',
  'תרגול',
  'תרגולים',
  'משימה',
  'משימות',
  'חוברת',
  'חוברות',
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
  'מחברת הקשר',
  'בקבוק מים',
  'טופס',
  'לחתום',
  'תזכורת',
]

const SUBJECT_PATTERNS: { names: string[]; label: string; icon: string }[] = [
  { names: ['תנ"ך', 'תנ״ך', 'תנך'], label: 'תנ"ך', icon: '📖' },
  { names: ['חשבון', 'מתמטיקה'], label: 'חשבון', icon: '➗' },
  { names: ['שפה', 'עברית'], label: 'שפה', icon: '📝' },
  { names: ['אנגלית'], label: 'אנגלית', icon: '🔤' },
  { names: ['מדעים', 'מדע'], label: 'מדעים', icon: '🔬' },
  { names: ['היסטוריה'], label: 'היסטוריה', icon: '🏛️' },
  { names: ['גיאוגרפיה'], label: 'גיאוגרפיה', icon: '🗺️' },
]

const DATE_RE = /(\d{1,2})[./](\d{1,2})/
const TIME_RE = /(\d{1,2}):(\d{2})/
const BULLET_RE = /^[•‣▪●○]\s*/
const SECTION_START_RE = /^(?:\p{Extended_Pictographic}|\d+[.)])/u

export function eventIcon(text: string): string {
  if (text.includes('טיול')) return '🚌'
  if (text.includes('מסיבה')) return '🎉'
  if (text.includes('אסיפה')) return '🗣️'
  if (text.includes('יום הולדת')) return '🎂'
  if (text.includes('חופשה') || text.includes('חופש')) return '🏖️'
  if (text.includes('חג') || text.includes('סוכות') || text.includes('חנוכה')) return '🍎'
  if (text.includes('הצגה') || text.includes('מופע') || text.includes('טקס')) return '🎭'
  if (text.includes('ספורט')) return '⚽'
  return '📌'
}

export function extractSubject(text: string): { label: string; icon: string } | undefined {
  return SUBJECT_PATTERNS.find((s) => s.names.some((n) => text.includes(n)))
}

export function assignmentIcon(text: string): string {
  const subject = extractSubject(text)
  if (subject) return subject.icon
  if (text.includes('מבחן') || text.includes('בוחן')) return '✏️'
  if (text.includes('תרגיל') || text.includes('תרגול')) return '🧮'
  if (text.includes('דף עבודה')) return '📄'
  return '📓'
}

const QUOTE_RE = /["״"]([^"״"”]{2,40})["״"”]/

// Best-effort: identify what the assignment is actually based on - a named
// text handed to students, a workbook, or a website - so parents know where
// to go, not just what the topic is.
export function extractSource(text: string): string | undefined {
  const quoted = text.match(QUOTE_RE)
  if (quoted) {
    const name = quoted[1].replace(/\*/g, '').trim()
    if (text.includes('חוברת')) return `חוברת: ${name}`
    if (name) return `טקסט: ${name}`
  }
  const siteMatch = text.match(/אתר\s+([א-ת]+)/)
  if (siteMatch) return `אתר ${siteMatch[1]}`
  if (text.includes('חוברת')) return 'חוברת עבודה'
  return undefined
}

export function announcementIcon(text: string): string {
  if (text.includes('תלבושת')) return '👕'
  if (text.includes('שכפ') || text.includes('ציוד') || text.includes('בקבוק מים')) return '🎒'
  if (text.includes('טופס') || text.includes('לחתום')) return '✍️'
  if (text.includes('מחברת')) return '📓'
  return '📌'
}

export interface ResolvedDate {
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
export function resolveDate(text: string, now: Date): ResolvedDate {
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

export function cleanLine(line: string): string {
  return line.replace(BULLET_RE, '').replace(/\*/g, '').trim()
}

// A real teacher message often mixes several unrelated topics - a school-closure
// notice, homework for two different subjects, a reminder - in one go, and often
// groups homework under a "📖 1. subject" / "🔢 2. subject" style header followed
// by bullet-point tasks. This walks the message line by line, keeps track of the
// active subject header, and groups its bullets into one assignment card per
// subject instead of a single blended card (or, worse, losing the bullets
// entirely because no single bullet contains a homework keyword on its own).
export function classifyMessage(text: string, hasPhoto: boolean, sentAt: Date = new Date()): ClassificationResult {
  const events: EventMeta[] = []
  const assignments: AssignmentMeta[] = []
  const announcements: AnnouncementMeta[] = []

  let currentSubject: { label: string; icon: string } | undefined
  let buffer: string[] = []
  let bufferDate: ResolvedDate | undefined
  const eventGroupLines = new Map<(string | RegExp)[], string[]>()

  const flushBuffer = () => {
    if (buffer.length === 0) return
    const combined = buffer.join(' · ')
    const subjectFallback = currentSubject ?? extractSubject(combined)
    assignments.push({
      subject: subjectFallback?.label ?? GENERAL_SUBJECT,
      source: extractSource(combined),
      content: combined,
      icon: subjectFallback?.icon ?? assignmentIcon(combined),
      dateLabel: bufferDate?.label ?? 'בקרוב',
      dateIso: bufferDate?.iso,
      weekday: bufferDate?.weekday,
    })
    buffer = []
    bufferDate = undefined
  }

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (SECTION_START_RE.test(line)) {
      flushBuffer()
      currentSubject = extractSubject(line)
      continue
    }

    const matchedEventGroup = EVENT_KEYWORD_GROUPS.find((group) => group.some((k) => matchesKeyword(line, k)))
    if (matchedEventGroup) {
      const linesForGroup = eventGroupLines.get(matchedEventGroup) ?? []
      linesForGroup.push(cleanLine(line))
      eventGroupLines.set(matchedEventGroup, linesForGroup)
    }

    if (ANNOUNCEMENT_KEYWORDS.some((k) => line.includes(k))) {
      announcements.push({
        text: cleanLine(line),
        icon: announcementIcon(line),
        dateLabel: resolveDate(line, sentAt).label,
      })
    }

    if (BULLET_RE.test(line) || ASSIGNMENT_KEYWORDS.some((k) => line.includes(k))) {
      buffer.push(cleanLine(line))
      const resolved = resolveDate(line, sentAt)
      if (resolved.iso) bufferDate = resolved
    }
  }

  // One event per matched group, even if several lines mentioned it in
  // different words - prefer whichever of those lines actually carries a
  // resolvable date over just taking the first mention.
  for (const candidateLines of eventGroupLines.values()) {
    const bestLine = candidateLines.find((l) => resolveDate(l, sentAt).iso) ?? candidateLines[0]
    const timeMatch = bestLine.match(TIME_RE)
    const resolved = resolveDate(bestLine, sentAt)
    events.push({
      title: bestLine,
      date: resolved.label,
      dateIso: resolved.iso,
      time: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined,
      icon: eventIcon(bestLine),
      location: 'בית הספר',
    })
  }

  flushBuffer()

  return finalizeResult(hasPhoto, events, assignments, announcements, 'rules')
}

export const destinationLabel: Record<DestinationTag, string> = {
  event: 'יומן האירועים',
  assignment: 'מטלות כיתה ובית',
  announcement: 'הודעות',
  gallery: 'הגלריה',
  general: 'עדכונים אחרונים',
}
