import { useEffect, useRef, useState } from 'react'
import type { Photo } from '../data'
import { ImageIcon } from './icons'

interface Props {
  photos: Photo[]
  highlightSourceId?: string | null
  onHighlighted?: () => void
}

export default function GalleryTab({ photos, highlightSourceId, onHighlighted }: Props) {
  const [active, setActive] = useState<Photo | null>(null)
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Arriving here from a routing-tag click in the chat - scroll to the
  // photo that message produced and flash it briefly.
  useEffect(() => {
    if (!highlightSourceId) return
    const el = scrollRef.current?.querySelector(`[data-source-id="${highlightSourceId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveHighlight(highlightSourceId)
    onHighlighted?.()
    const timer = setTimeout(() => setActiveHighlight(null), 2200)
    return () => clearTimeout(timer)
  }, [highlightSourceId, photos, onHighlighted])

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto px-4 py-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-leaf-50 text-leaf-600">
          <ImageIcon className="h-[18px] w-[18px]" />
        </span>
        תמונות כיתתיות
      </h2>
      <p className="mb-4 text-xs text-slate-400">נאספות אוטומטית כשהמורה מצרפת תמונה לצ'אט</p>

      {photos.length === 0 && (
        <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-400">אין עדיין תמונות</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            data-source-id={p.sourceMessageId}
            onClick={() => setActive(p)}
            className={`group relative aspect-square overflow-hidden rounded-2xl shadow-sm transition active:scale-95 ${
              p.imageUrl ? '' : `bg-gradient-to-br ${p.gradient} text-white`
            } ${activeHighlight === p.sourceMessageId ? 'ring-4 ring-brand-400' : ''}`}
          >
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.caption} className="h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-3xl">{p.emoji}</span>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/40 px-1.5 py-1 text-start text-[10px] font-semibold leading-tight text-white opacity-0 backdrop-blur-sm transition group-active:opacity-100">
              {p.caption}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 p-6 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div className="w-full max-w-xs overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {active.imageUrl ? (
              <img src={active.imageUrl} alt={active.caption} className="aspect-video w-full object-cover" />
            ) : (
              <div className={`grid aspect-video place-items-center bg-gradient-to-br ${active.gradient} text-6xl text-white`}>
                {active.emoji}
              </div>
            )}
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-900">{active.caption}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{active.date}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
