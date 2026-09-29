import { useMemo, useState } from 'react'
import type { AnnouncementCard } from '../data'
import { downloadXlsx } from '../xlsxExport'
import { DAY_FILTER_OPTIONS, matchesDayFilter, type DayFilterValue } from '../dayFilter'
import { BellIcon } from './icons'
import ExpandableText from './ExpandableText'
import DayFilterBar from './DayFilterBar'

interface Props {
  announcements: AnnouncementCard[]
  unreadSince: number
  onOpenSource: (id?: string) => void
}

interface DayBubble {
  key: string
  dayLabel: string
  weekday: string
  items: AnnouncementCard[]
}

// Announcements are grouped by the day they were *sent* - a message that
// says "bring this tomorrow" still belongs with everything else sent today,
// not off in its own "tomorrow" bubble.
function groupByDay(announcements: AnnouncementCard[]): DayBubble[] {
  const byDay = new Map<string, AnnouncementCard[]>()
  for (const a of [...announcements].sort((x, y) => x.ts - y.ts)) {
    const key = a.dayIso || a.dayLabel
    const items = byDay.get(key) ?? []
    items.push(a)
    byDay.set(key, items)
  }

  return [...byDay.entries()]
    .map(([key, items]) => ({ key, dayLabel: items[0].dayLabel, weekday: items[0].weekday, items }))
    .sort((x, y) => y.items[y.items.length - 1].ts - x.items[x.items.length - 1].ts)
}

export default function AnnouncementsTab({ announcements, unreadSince, onOpenSource }: Props) {
  const [filter, setFilter] = useState<DayFilterValue>('all')
  const bubbles = useMemo(() => groupByDay(announcements), [announcements])
  const filteredBubbles = useMemo(
    () => bubbles.filter((b) => matchesDayFilter(b.key, filter, new Date())),
    [bubbles, filter],
  )

  const handleExport = () => {
    const filterLabel = DAY_FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? ''
    const rows = filteredBubbles.flatMap((b) => b.items.map((n) => [`${b.weekday} ${b.dayLabel}`, `${n.icon} ${n.text}`]))
    downloadXlsx(`הודעות_${filterLabel}.xlsx`, ['תאריך', 'תוכן'], rows)
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-500">
          <BellIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">הודעות מהמורה</h2>
      </div>
      <p className="mb-3 text-xs text-slate-400">החדש ביותר למעלה</p>

      <DayFilterBar value={filter} onChange={setFilter} onExport={handleExport} />

      {bubbles.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין הודעות</p>
      )}
      {bubbles.length > 0 && filteredBubbles.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין הודעות בטווח שנבחר</p>
      )}

      <ul className="flex flex-col gap-3">
        {filteredBubbles.map((bubble) => (
          <li key={bubble.key} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold text-slate-900">{bubble.weekday}</span>
              <span className="text-xs font-bold text-slate-400">{bubble.dayLabel}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {bubble.items.map((n) => {
                const isUnread = n.ts > unreadSince
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenSource(n.sourceMessageId)}
                    onKeyDown={(e) => e.key === 'Enter' && onOpenSource(n.sourceMessageId)}
                    className="flex cursor-pointer items-start"
                  >
                    <div
                      className={`max-w-full rounded-2xl rounded-ss-sm px-3.5 py-2.5 ${
                        isUnread ? 'bg-amber-100' : 'bg-rose-50'
                      }`}
                    >
                      <ExpandableText text={`${n.icon} ${n.text}`} className="text-sm leading-relaxed text-slate-800" />
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
