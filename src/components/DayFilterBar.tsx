import { useState } from 'react'
import { DAY_FILTER_OPTIONS, type DayFilterValue } from '../dayFilter'
import { DownloadIcon, FilterIcon } from './icons'

interface Props {
  value: DayFilterValue
  onChange: (v: DayFilterValue) => void
  onExport: () => void
}

export default function DayFilterBar({ value, onChange, onExport }: Props) {
  const [open, setOpen] = useState(false)
  const current = DAY_FILTER_OPTIONS.find((o) => o.value === value) ?? DAY_FILTER_OPTIONS[0]

  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <FilterIcon className="h-3.5 w-3.5" />
          {current.label}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute start-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
              {DAY_FILTER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`block w-full px-3 py-2 text-start text-xs font-semibold transition ${
                    o.value === value ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
      >
        <DownloadIcon className="h-3.5 w-3.5" />
        ייצוא לאקסל
      </button>
    </div>
  )
}
