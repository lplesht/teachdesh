import type { AssignmentCard } from '../data'
import { ClipboardIcon } from './icons'
import ExpandableText from './ExpandableText'

interface Props {
  assignments: AssignmentCard[]
}

export default function BoardTab({ assignments }: Props) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sun-100 text-sun-600">
          <ClipboardIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">מטלות כיתה ובית</h2>
      </div>
      <p className="mb-4 text-xs text-slate-400">מתעדכן אוטומטית מהודעות המורה - החדש ביותר למעלה</p>

      {assignments.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין מטלות פתוחות</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {assignments.map((a) => (
          <li key={a.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg">{a.icon}</span>
            <div className="min-w-0 flex-1">
              {a.subject && (
                <span className="mb-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {a.subject}
                </span>
              )}
              <ExpandableText text={a.text} className="text-sm leading-relaxed text-slate-800" />
              <span className="mt-1 inline-block rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-bold text-sun-600">
                {a.weekday ? `${a.weekday} · ` : ''}
                {a.dateLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
