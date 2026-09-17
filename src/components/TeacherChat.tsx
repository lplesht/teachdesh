import { useState } from 'react'
import type { ChatMessage, Role } from '../data'

interface Props {
  messages: ChatMessage[]
  role: Role
  onSend: (text: string) => void
  onLike: (id: string) => void
}

export default function TeacherChat({ messages, role, onSend, onLike }: Props) {
  const [text, setText] = useState('')

  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <section className="flex flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span>💬</span> צ'אט הכיתה
        </h2>
        <span className="flex items-center gap-1 text-xs font-medium text-leaf-600">
          <span className="h-1.5 w-1.5 rounded-full bg-leaf-500" /> פעיל עכשיו
        </span>
      </div>

      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pe-1">
        {messages.map((m) => {
          const isTeacher = m.from === 'teacher'
          return (
            <div key={m.id} className={`flex flex-col ${isTeacher ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isTeacher
                    ? 'rounded-ss-sm bg-brand-50 text-slate-800'
                    : 'rounded-se-sm bg-slate-100 text-slate-800'
                }`}
              >
                <p className="mb-0.5 text-[11px] font-bold text-brand-700">
                  {isTeacher ? `👩‍🏫 ${m.authorName}` : m.authorName}
                </p>
                {m.text}
              </div>
              <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
                <span>{m.time}</span>
                <button
                  type="button"
                  onClick={() => onLike(m.id)}
                  className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  ❤️ {m.likes}
                </button>
                {isTeacher && m.readBy > 0 && <span>נקרא ע"י {m.readBy} הורים</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && role === 'teacher' && submit()}
          disabled={role !== 'teacher'}
          placeholder={role === 'teacher' ? 'כתבי הודעה להורי הכיתה...' : 'רק המורה יכולה לשלוח הודעות בצ׳אט זה'}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={role !== 'teacher' || !text.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          aria-label="שלח"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="-scale-x-100">
            <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" />
          </svg>
        </button>
      </div>
    </section>
  )
}
