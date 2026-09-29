import { toISO } from './dateUtils'

export type DayFilterValue = 'all' | 'today' | '2days' | 'week' | 'month'

export const DAY_FILTER_OPTIONS: { value: DayFilterValue; label: string }[] = [
  { value: 'all', label: 'הכל' },
  { value: 'today', label: 'היום' },
  { value: '2days', label: 'יומיים אחרונים' },
  { value: 'week', label: 'השבוע האחרון' },
  { value: 'month', label: 'החודש האחרון' },
]

// null = no cutoff (show everything); otherwise the number of most-recent
// calendar days to keep, counting today as day 1.
const FILTER_DAYS: Record<DayFilterValue, number | null> = {
  all: null,
  today: 1,
  '2days': 2,
  week: 7,
  month: 30,
}

// dayIso may be missing/non-ISO on legacy docs pre-dating the day-grouping
// fields - those simply never match a dated filter, only "הכל".
export function matchesDayFilter(dayIso: string, filter: DayFilterValue, now: Date): boolean {
  const days = FILTER_DAYS[filter]
  if (days === null) return true
  const diff = Math.round((new Date(toISO(now)).getTime() - new Date(dayIso).getTime()) / 86_400_000)
  return Number.isFinite(diff) && diff >= 0 && diff < days
}
