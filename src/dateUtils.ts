export const WEEKDAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת']
export const WEEKDAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
]

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function weekdayName(d: Date): string {
  return WEEKDAYS[d.getDay()]
}

export function shiftDay(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

// The label a WhatsApp-style date divider shows above a run of messages
// from the same day - "היום"/"אתמול" for the two most recent days, the
// full date otherwise.
export function formatDayLabel(ts: number, now: Date = new Date()): string {
  const d = new Date(ts)
  const dayIso = toISO(d)
  if (dayIso === toISO(now)) return 'היום'
  if (dayIso === toISO(shiftDay(now, -1))) return 'אתמול'
  return `${d.getDate()} ב${HEBREW_MONTHS[d.getMonth()]}`
}
