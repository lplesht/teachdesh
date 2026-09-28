import { useMemo } from 'react'
import type { AnnouncementCard } from '../data'
import { BellIcon } from './icons'
import ExpandableText from './ExpandableText'

interface Props {
  announcements: AnnouncementCard[]
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

export default function AnnouncementsTab({ announcements }: Props) {
  const bubbles = useMemo(() => groupByDay(announcements), [announcements])

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-500">
          <BellIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">הודעות מהמורה</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">החדש ביותר למעלה</p>

      {bubbles.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין הודעות</p>
      )}

      <ul className="flex flex-col gap-3">
        {bubbles.map((bubble) => (
          <li key={bubble.key} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <div className="mb-2.5 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="text-sm font-extrabold text-slate-900">{bubble.weekday}</span>
              <span className="text-xs font-bold text-slate-400">{bubble.dayLabel}</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-50">
              {bubble.items.map((n) => (
                <div key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                  <ExpandableText text={`${n.icon} ${n.text}`} className="text-sm leading-relaxed text-slate-800" />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
