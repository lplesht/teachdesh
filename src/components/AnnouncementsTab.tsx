import { useState } from 'react'
import type { AnnouncementCard } from '../data'
import { BellIcon } from './icons'

interface Props {
  announcements: AnnouncementCard[]
}

export default function AnnouncementsTab({ announcements }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-500">
          <BellIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">הודעות מהמורה</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">כל הודעה עם תאריך - לחיצה על כרטיס מציגה אותו במלואו</p>

      {announcements.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין הודעות</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {announcements.map((n) => {
          const isExpanded = expandedId === n.id
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : n.id)}
                className="flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 text-right shadow-sm transition hover:border-brand-100"
              >
                <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-brand-600 px-1 text-center text-sm font-extrabold leading-tight text-white shadow-sm">
                  {n.dateLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-relaxed text-slate-800 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    <span className="ml-1">{n.icon}</span>
                    {n.text}
                  </p>
                  {!isExpanded && <span className="mt-0.5 block text-[11px] font-semibold text-brand-600">הצג הכל</span>}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
