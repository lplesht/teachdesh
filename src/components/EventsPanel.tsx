import { useState } from 'react'
import type { Role, SchoolEvent } from '../data'

interface Props {
  events: SchoolEvent[]
  role: Role
  onRsvp: (id: string, answer: 'yes' | 'no') => void
  onCreate: (title: string, date: string, time: string, location: string) => void
}

export default function EventsPanel({ events, role, onRsvp, onCreate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '' })

  const submit = () => {
    if (!form.title.trim() || !form.date.trim()) return
    onCreate(form.title.trim(), form.date.trim(), form.time.trim() || '—', form.location.trim() || 'בית הספר')
    setForm({ title: '', date: '', time: '', location: '' })
    setShowForm(false)
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span>📅</span> אירועים קרובים
        </h2>
        {role === 'teacher' && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
          >
            {showForm ? 'ביטול' : '+ אירוע חדש'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="שם האירוע"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex gap-2">
            <input
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              placeholder="תאריך (למשל 12.10)"
              className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <input
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              placeholder="שעה"
              className="w-1/2 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="מיקום"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={submit}
            className="mt-1 rounded-xl bg-brand-600 py-2 text-xs font-bold text-white hover:bg-brand-700"
          >
            פרסום האירוע להורים
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">
                {ev.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-900">{ev.title}</h3>
                <p className="text-xs text-slate-500">
                  {ev.date} · {ev.time} · {ev.location}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                ✅ {ev.rsvpYes} מגיעים · ❌ {ev.rsvpNo} לא מגיעים
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onRsvp(ev.id, 'yes')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    ev.myRsvp === 'yes' ? 'bg-leaf-500 text-white' : 'bg-white text-leaf-600 ring-1 ring-leaf-200 hover:bg-leaf-50'
                  }`}
                >
                  מגיע/ה
                </button>
                <button
                  type="button"
                  onClick={() => onRsvp(ev.id, 'no')}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                    ev.myRsvp === 'no' ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 ring-1 ring-rose-200 hover:bg-rose-50'
                  }`}
                >
                  לא מגיע/ה
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
