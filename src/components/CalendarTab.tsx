import type { EventCard, Role } from '../data'

interface Props {
  events: EventCard[]
  role: Role
  onRsvp: (id: string, answer: 'yes' | 'no') => void
}

export default function CalendarTab({ events, role, onRsvp }: Props) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span>📅</span> אירועים קרובים
      </h2>
      <p className="mb-4 text-xs text-slate-400">מתעדכן אוטומטית מהודעות המורה בצ'אט</p>

      {events.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין אירועים קרובים</p>
      )}

      <ul className="flex flex-col gap-3">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">
                {ev.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold leading-snug text-slate-900">{ev.title}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {ev.date}
                  {ev.time ? ` · ${ev.time}` : ''} · {ev.location}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                ✅ {ev.rsvpYes} · ❌ {ev.rsvpNo}
              </span>
              {role === 'parent' && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRsvp(ev.id, 'yes')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      ev.myRsvp === 'yes' ? 'bg-leaf-500 text-white' : 'bg-white text-leaf-600 ring-1 ring-leaf-200'
                    }`}
                  >
                    מגיע/ה
                  </button>
                  <button
                    type="button"
                    onClick={() => onRsvp(ev.id, 'no')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                      ev.myRsvp === 'no' ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 ring-1 ring-rose-200'
                    }`}
                  >
                    לא מגיע/ה
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
