import { useRef, useState } from 'react'
import type { ChatMessage, Role } from '../data'
import { destinationLabel, type DestinationTag } from '../classify'

interface Props {
  messages: ChatMessage[]
  role: Role
  routingToast: string | null
  onSend: (text: string, photoDataUrl?: string) => void
  onLike: (id: string) => void
}

const tagStyles: Record<DestinationTag, string> = {
  event: 'bg-brand-50 text-brand-700',
  reminder: 'bg-sun-100 text-sun-600',
  gallery: 'bg-leaf-100 text-leaf-600',
  general: 'bg-slate-100 text-slate-500',
}

export default function ChatScreen({ messages, role, routingToast, onSend, onLike }: Props) {
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (!text.trim() && !photo) return
    onSend(text.trim(), photo)
    setText('')
    setPhoto(undefined)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex h-full flex-col">
      {routingToast && (
        <div className="mx-3 mt-3 shrink-0 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg">
          {routingToast}
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((m) => {
          const isTeacher = m.from === 'teacher'
          const shownTags = m.tags.filter((t) => t !== 'general')
          return (
            <div key={m.id} className={`flex flex-col ${isTeacher ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isTeacher ? 'rounded-ss-sm bg-brand-50 text-slate-800' : 'rounded-se-sm bg-slate-100 text-slate-800'
                }`}
              >
                <p className="mb-0.5 text-[11px] font-bold text-brand-700">
                  {isTeacher ? `👩‍🏫 ${m.authorName}` : m.authorName}
                </p>
                {m.photoUrl && (
                  <img src={m.photoUrl} alt="" className="mb-2 max-h-48 w-full rounded-xl object-cover" />
                )}
                {m.text && <p>{m.text}</p>}
              </div>

              {isTeacher && shownTags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 px-1">
                  {shownTags.map((tag) => (
                    <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tagStyles[tag]}`}>
                      🤖 {destinationLabel[tag]}
                    </span>
                  ))}
                </div>
              )}

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

      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
        {role === 'teacher' ? (
          <>
            {photo && (
              <div className="relative mb-2 inline-block">
                <img src={photo} alt="" className="h-16 w-16 rounded-xl object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(undefined)}
                  className="absolute -top-1.5 -left-1.5 grid h-5 w-5 place-items-center rounded-full bg-slate-900 text-[10px] text-white"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-lg text-slate-500 transition hover:bg-slate-200"
                aria-label="צרף תמונה"
              >
                📎
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="כתבי עדכון, שיעורי בית, אירוע..."
                className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() && !photo}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                aria-label="שלח"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="-scale-x-100">
                  <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-slate-400">
              ✨ המערכת מזהה אוטומטית הודעות על אירועים, שיעורי בית ותמונות ומוסיפה אותן ללוחות המתאימים
            </p>
          </>
        ) : (
          <input
            disabled
            placeholder="רק המורה יכולה לשלוח כאן עדכונים"
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 outline-none"
          />
        )}
      </div>
    </div>
  )
}
