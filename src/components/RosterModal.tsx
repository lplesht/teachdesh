import { useRef, useState } from 'react'

interface Props {
  students: string[]
  onClose: () => void
  onUpdate: (names: string[]) => void
}

function parseNames(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function RosterModal({ students, onClose, onUpdate }: Props) {
  const [text, setText] = useState(students.join('\n'))
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const names = parseNames(String(reader.result ?? ''))
      setText(names.join('\n'))
    }
    reader.readAsText(file)
  }

  const save = () => {
    onUpdate(parseNames(text))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 flex items-center gap-2 text-base font-extrabold text-slate-900">
          <span>🧾</span> עדכון דף קשר כיתתי
        </h2>
        <p className="mb-4 text-xs text-slate-500">
          כמות התלמידים בדשבורד מבוססת על רשימת השמות כאן. אפשר להעלות קובץ (CSV/TXT) או להדביק רשימה - שם תלמיד בכל שורה.
        </p>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50/60 py-3 text-xs font-bold text-brand-700"
        >
          📤 העלאת קובץ דף קשר {fileName ? `· ${fileName}` : ''}
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="שם תלמיד בכל שורה..."
          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />

        <p className="mt-2 text-xs font-semibold text-slate-500">{parseNames(text).length} תלמידים ברשימה</p>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600">
            ביטול
          </button>
          <button type="button" onClick={save} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white">
            שמירה
          </button>
        </div>
      </div>
    </div>
  )
}
