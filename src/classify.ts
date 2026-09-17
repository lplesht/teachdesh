export type DestinationTag = 'event' | 'reminder' | 'gallery' | 'general'

export interface EventMeta {
  title: string
  date: string
  time?: string
  icon: string
  location: string
}

export interface ReminderMeta {
  text: string
  icon: string
  dateLabel: string
}

export interface ClassificationResult {
  tags: DestinationTag[]
  eventMeta?: EventMeta
  reminderMeta?: ReminderMeta
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

const REMINDER_KEYWORDS = [
  'שיעורי בית',
  'להביא',
  'לא לשכוח',
  'תלבושת',
  'ציוד',
  'שכפ"ץ',
  'שכפץ',
  'מחברת',
  'דף עבודה',
  'עבודה',
  'מבחן',
  'בוחן',
  'לחתום',
  'טופס',
  'בקבוק מים',
]

const DATE_RE = /(\d{1,2})[./](\d{1,2})/
const TIME_RE = /(\d{1,2}):(\d{2})/
const RELATIVE_DAYS = ['מחרתיים', 'מחר', 'היום', 'יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']

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

function reminderIcon(text: string): string {
  if (text.includes('תלבושת')) return '👕'
  if (text.includes('שכפ') || text.includes('ציוד') || text.includes('בקבוק מים')) return '🎒'
  if (text.includes('מחברת') || text.includes('דף עבודה') || text.includes('שיעורי בית')) return '📓'
  if (text.includes('מבחן') || text.includes('בוחן')) return '✏️'
  if (text.includes('טופס') || text.includes('לחתום')) return '✍️'
  return '📝'
}

function extractDateLabel(text: string): string {
  const dateMatch = text.match(DATE_RE)
  if (dateMatch) return `${dateMatch[1]}.${dateMatch[2]}`
  const day = RELATIVE_DAYS.find((d) => text.includes(d))
  if (day) return day
  return 'בקרוב'
}

function truncate(text: string, max: number): string {
  const firstLine = text.split('\n')[0].trim()
  if (firstLine.length <= max) return firstLine
  return `${firstLine.slice(0, max).trim()}…`
}

export function classifyMessage(text: string, hasPhoto: boolean): ClassificationResult {
  const tags: DestinationTag[] = []
  if (hasPhoto) tags.push('gallery')

  const isEvent = EVENT_KEYWORDS.some((k) => text.includes(k)) || DATE_RE.test(text)
  const isReminder = REMINDER_KEYWORDS.some((k) => text.includes(k))

  let eventMeta: EventMeta | undefined
  let reminderMeta: ReminderMeta | undefined

  if (isEvent) {
    tags.push('event')
    const timeMatch = text.match(TIME_RE)
    eventMeta = {
      title: truncate(text, 42),
      date: extractDateLabel(text),
      time: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : undefined,
      icon: eventIcon(text),
      location: 'בית הספר',
    }
  }

  if (isReminder) {
    tags.push('reminder')
    reminderMeta = {
      text: truncate(text, 60),
      icon: reminderIcon(text),
      dateLabel: extractDateLabel(text),
    }
  }

  if (!isEvent && !isReminder) tags.push('general')

  return { tags, eventMeta, reminderMeta }
}

export const destinationLabel: Record<DestinationTag, string> = {
  event: '📅 יומן האירועים',
  reminder: '📝 לוח המטלות',
  gallery: '📷 הגלריה',
  general: '🏠 עדכונים אחרונים',
}
