import { useState } from 'react'
import type { Photo, Role } from '../data'

interface Props {
  photos: Photo[]
  role: Role
  onAdd: () => void
}

export default function ClassGallery({ photos, role, onAdd }: Props) {
  const [active, setActive] = useState<Photo | null>(null)

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span>📷</span> תמונות כיתתיות
        </h2>
        {role === 'teacher' && (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
          >
            + הוסף תמונה
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(p)}
            className={`group relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-sm transition hover:scale-[1.03] hover:shadow-md`}
          >
            <span className="absolute inset-0 grid place-items-center text-3xl transition group-hover:scale-110 sm:text-4xl">
              {p.emoji}
            </span>
            <span className="absolute inset-x-0 bottom-0 bg-black/35 px-1.5 py-1 text-start text-[10px] font-semibold leading-tight opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
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
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`grid aspect-video place-items-center bg-gradient-to-br ${active.gradient} text-6xl text-white`}>
              {active.emoji}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-900">{active.caption}</h3>
              <p className="mt-0.5 text-xs text-slate-400">{active.date}</p>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
              >
                סגירה
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
