import { useState } from 'react'
import type { Announcement, Role } from '../data'

interface Props {
  announcements: Announcement[]
  role: Role
  onAdd: (title: string, body: string) => void
}

const tagStyles: Record<Announcement['tag'], string> = {
  הודעה: 'bg-brand-50 text-brand-700',
  תזכורת: 'bg-sun-100 text-sun-600',
  דחוף: 'bg-rose-100 text-rose-600',
}

export default function AnnouncementsFeed({ announcements, role, onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const submit = () => {
    if (!title.trim() || !body.trim()) return
    onAdd(title.trim(), body.trim())
    setTitle('')
    setBody('')
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span>📣</span> הודעות אחרונות
        </h2>
        <span className="text-xs font-medium text-slate-400">{announcements.length} הודעות</span>
      </div>

      {role === 'teacher' && (
        <div className="mb-5 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
          <p className="mb-2 text-xs font-bold text-brand-700">✍️ פרסום הודעה חדשה להורי הכיתה</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="כותרת ההודעה"
            className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="תוכן ההודעה..."
            rows={2}
            className="mb-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <div className="flex items-center justify-between">
            <button type="button" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">
              📎 צרף תמונה
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-40"
              disabled={!title.trim() || !body.trim()}
            >
              שלח לכל ההורים
            </button>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {announcements.map((a) => (
          <li
            key={a.id}
            className={`rounded-2xl border p-4 transition hover:shadow-sm ${
              a.pinned ? 'border-sun-200 bg-sun-50/60' : 'border-slate-100 bg-slate-50/60'
            }`}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              {a.pinned && <span className="text-sm">📌</span>}
              <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tagStyles[a.tag]}`}>{a.tag}</span>
              <span className="ms-auto text-[11px] text-slate-400">{a.time}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{a.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
