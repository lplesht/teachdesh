import { useState } from 'react'
import type { Photo } from '../data'

interface Props {
  photos: Photo[]
}

export default function GalleryTab({ photos }: Props) {
  const [active, setActive] = useState<Photo | null>(null)

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span>📷</span> תמונות כיתתיות
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
            onClick={() => setActive(p)}
            className={`group relative aspect-square overflow-hidden rounded-2xl shadow-sm transition active:scale-95 ${
              p.imageUrl ? '' : `bg-gradient-to-br ${p.gradient} text-white`
            }`}
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
