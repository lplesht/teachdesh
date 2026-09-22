import type { AnnouncementCard } from '../data'

interface Props {
  announcements: AnnouncementCard[]
}

export default function AnnouncementsTab({ announcements }: Props) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span>📌</span> הודעות מהמורה
      </h2>
      <p className="mb-4 text-xs text-slate-400">כל הודעה עם תאריך - ממוינת לפי הזמן שנקבע</p>

      {announcements.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין הודעות 📭</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {announcements.map((n) => (
          <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
            <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-brand-600 px-1 text-center text-sm font-extrabold leading-tight text-white shadow-sm">
              {n.dateLabel}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-slate-800">
                <span className="ml-1">{n.icon}</span>
                {n.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
