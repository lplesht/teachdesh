import { useMemo, useState } from 'react'
import type { AssignmentCard } from '../data'
import { downloadCsv } from '../csvExport'
import { DAY_FILTER_OPTIONS, matchesDayFilter, type DayFilterValue } from '../dayFilter'
import { ClipboardIcon } from './icons'
import ExpandableText from './ExpandableText'
import DayFilterBar from './DayFilterBar'

interface Props {
  assignments: AssignmentCard[]
  unreadSince: number
  onOpenSource: (id?: string) => void
}

interface DayBubble {
  key: string
  dayLabel: string
  weekday: string
  items: AssignmentCard[]
}

// Assignments are given a fresh card per subject-segment as they're
// classified, but parents should see them grouped by the day the teacher
// actually gave them - all subjects from that day in one bubble, in the
// order they were given - not one scattered card per subject.
function groupByDay(assignments: AssignmentCard[]): DayBubble[] {
  const byDay = new Map<string, AssignmentCard[]>()
  for (const a of [...assignments].sort((x, y) => x.ts - y.ts)) {
    const key = a.dayIso || a.dayLabel
    const items = byDay.get(key) ?? []
    items.push(a)
    byDay.set(key, items)
  }

  return [...byDay.entries()]
    .map(([key, items]) => ({ key, dayLabel: items[0].dayLabel, weekday: items[0].weekday, items }))
    .sort((x, y) => y.items[y.items.length - 1].ts - x.items[x.items.length - 1].ts)
}

export default function BoardTab({ assignments, unreadSince, onOpenSource }: Props) {
  const [filter, setFilter] = useState<DayFilterValue>('all')
  const bubbles = useMemo(() => groupByDay(assignments), [assignments])
  const filteredBubbles = useMemo(
    () => bubbles.filter((b) => matchesDayFilter(b.key, filter, new Date())),
    [bubbles, filter],
  )

  const handleExport = () => {
    const filterLabel = DAY_FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? ''
    const rows = filteredBubbles.flatMap((b) =>
      b.items.map((a) => [`${b.weekday} ${b.dayLabel}`, a.subject, a.source ?? '', a.pages ?? '', a.content]),
    )
    downloadCsv(`מטלות_${filterLabel}.csv`, ['תאריך', 'מקצוע', 'מקור', 'עמודים', 'תוכן'], rows)
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sun-100 text-sun-600">
          <ClipboardIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">מטלות כיתה ובית</h2>
      </div>
      <p className="mb-3 text-xs text-slate-400">מתעדכן אוטומטית מהודעות המורה - החדש ביותר למעלה</p>

      <DayFilterBar value={filter} onChange={setFilter} onExport={handleExport} />

      {bubbles.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין מטלות פתוחות</p>
      )}
      {bubbles.length > 0 && filteredBubbles.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין מטלות בטווח שנבחר</p>
      )}

      <ul className="flex flex-col gap-3">
        {filteredBubbles.map((bubble) => (
          <li key={bubble.key} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold text-slate-900">{bubble.weekday}</span>
              <span className="text-xs font-bold text-slate-400">{bubble.dayLabel}</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-50">
              {bubble.items.map((a) => {
                const isUnread = a.ts > unreadSince
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSource(a.sourceMessageId)}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenSource(a.sourceMessageId)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl py-2.5 text-start first:pt-0 last:pb-0 ${
                      isUnread ? '-mx-2 bg-amber-50 px-2' : ''
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg">{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                          מקצוע: {a.subject}
                        </span>
                        {a.source && (
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            מקור: {a.source}
                          </span>
                        )}
                        {a.pages && (
                          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            עמודים: {a.pages}
                          </span>
                        )}
                      </div>
                      <ExpandableText text={a.content} className="text-sm leading-relaxed text-slate-800" />
                    </div>
                  </div>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
