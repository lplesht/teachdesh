import { dutyRoster } from '../data'
import type { AssignmentCard } from '../data'

interface Props {
  assignments: AssignmentCard[]
}

const today = 'שלישי'

export default function BoardTab({ assignments }: Props) {
  const sorted = [...assignments].sort((a, b) => {
    if (a.dateIso && b.dateIso) return a.dateIso.localeCompare(b.dateIso)
    if (a.dateIso) return -1
    if (b.dateIso) return 1
    return 0
  })

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span>📝</span> מטלות כיתה ובית
      </h2>
      <p className="mb-4 text-xs text-slate-400">מתעדכן אוטומטית מהודעות המורה - ממוין לפי תאריך ויום בשבוע ✏️</p>

      {sorted.length === 0 && (
        <p className="mb-6 rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין מטלות פתוחות 🎉</p>
      )}

      <ul className="mb-6 flex flex-col gap-2.5">
        {sorted.map((a) => (
          <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-lg shadow-sm">
              {a.icon}
            </span>
            <div className="min-w-0 flex-1">
              {a.subject && (
                <span className="mb-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {a.subject}
                </span>
              )}
              <p className="text-sm leading-relaxed text-slate-800">{a.text}</p>
              <span className="mt-1 inline-block rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-bold text-sun-600">
                📅 {a.weekday ? `${a.weekday} · ` : ''}{a.dateLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-900">
        <span>🧺</span> תורנות הורים השבוע
      </h2>
      <ul className="flex flex-col gap-2">
        {dutyRoster.map((d) => (
          <li
            key={d.day}
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${
              d.day === today ? 'bg-sun-50 ring-1 ring-sun-200' : 'bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-11 shrink-0 text-xs font-bold ${d.day === today ? 'text-sun-600' : 'text-slate-400'}`}>
                יום {d.day}
              </span>
              <span className="font-semibold text-slate-800">{d.parent}</span>
            </div>
            <span className="text-xs text-slate-500">{d.task}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
