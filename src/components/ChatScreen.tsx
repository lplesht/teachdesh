import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, Role, TabId } from '../data'
import { destinationLabel, type DestinationTag } from '../classify'
import { HeartIcon, TrashIcon } from './icons'

interface Props {
  messages: ChatMessage[]
  role: Role
  routingToast: string | null
  onSend: (text: string) => void
  onLike: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (tab: TabId, sourceMessageId: string) => void
  scrollToMessageId?: string | null
  onScrolledToMessage?: () => void
}

const tagStyles: Record<DestinationTag, string> = {
  event: 'bg-brand-50 text-brand-700',
  assignment: 'bg-sun-100 text-sun-600',
  announcement: 'bg-rose-50 text-rose-600',
  gallery: 'bg-leaf-100 text-leaf-600',
  general: 'bg-slate-100 text-slate-500',
}

const tagDestination: Partial<Record<DestinationTag, TabId>> = {
  event: 'calendar',
  assignment: 'board',
  announcement: 'announcements',
  gallery: 'gallery',
}

export default function ChatScreen({
  messages,
  role,
  routingToast,
  onSend,
  onLike,
  onDelete,
  onNavigate,
  scrollToMessageId,
  onScrolledToMessage,
}: Props) {
  const [text, setText] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  // Jumping in from a routed assignment/announcement card - find that exact
  // message and scroll to it instead of the usual scroll-to-bottom, with a
  // brief highlight so it's obvious which bubble was linked to.
  useEffect(() => {
    if (!scrollToMessageId) return
    const el = scrollRef.current?.querySelector(`[data-message-id="${scrollToMessageId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightId(scrollToMessageId)
    onScrolledToMessage?.()
    const timer = setTimeout(() => setHighlightId(null), 2200)
    return () => clearTimeout(timer)
  }, [scrollToMessageId, onScrolledToMessage])

  const submit = () => {
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  return (
    <div className="flex h-full flex-col">
      {routingToast && (
        <div className="mx-3 mt-3 shrink-0 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg">
          {routingToast}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {messages.map((m) => {
          const isTeacher = m.from === 'teacher'
          const shownTags = m.tags.filter((t) => t !== 'general')
          return (
            <div
              key={m.id}
              data-message-id={m.id}
              className={`flex flex-col rounded-2xl transition-colors duration-700 ${
                highlightId === m.id ? '-mx-2 bg-amber-100/70 px-2 py-1' : ''
              } ${isTeacher ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  isTeacher ? 'rounded-ss-sm bg-leaf-100 text-slate-800' : 'rounded-se-sm border border-slate-100 bg-white text-slate-800'
                }`}
              >
                <p className={`mb-0.5 flex items-center gap-1.5 text-[11px] font-bold ${isTeacher ? 'text-leaf-600' : 'text-brand-700'}`}>
                  {m.authorName}
                  {isTeacher && (
                    <span className="rounded-full bg-leaf-500 px-1.5 py-0.5 text-[9px] font-bold text-white">מורה</span>
                  )}
                </p>
                {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                <p className="mt-0.5 text-end text-[10px] text-slate-400">{m.time}</p>
              </div>

              {isTeacher && shownTags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1 px-1">
                  {shownTags.map((tag) => {
                    const destination = tagDestination[tag]
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => destination && onNavigate(destination, m.id)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition hover:opacity-80 ${tagStyles[tag]}`}
                      >
                        {destinationLabel[tag]}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => onLike(m.id)}
                  className="flex items-center gap-1 rounded-full px-1.5 py-0.5 transition hover:bg-rose-50 hover:text-rose-500"
                >
                  <HeartIcon className="h-3.5 w-3.5" filled={m.likes > 0} />
                  {m.likes}
                </button>
                {isTeacher && m.readBy > 0 && <span>נקרא ע"י {m.readBy} הורים</span>}
                {role === 'teacher' && (
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    className="flex items-center gap-1 rounded-full px-1.5 py-0.5 transition hover:bg-rose-50 hover:text-rose-500"
                    aria-label="מחקי הודעה"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5">
        {role === 'teacher' ? (
          <>
            <div className="flex items-center gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    submit()
                  }
                }}
                placeholder="כתבי עדכון, שיעורי בית, אירוע..."
                rows={Math.min(5, text.split('\n').length || 1)}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
                aria-label="שלח"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="-scale-x-100">
                  <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" />
                </svg>
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-slate-400">
              המערכת מסווגת אוטומטית אירועים, מטלות והודעות ללוחות המתאימים · Enter לשורה חדשה, Ctrl+Enter לשליחה
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
