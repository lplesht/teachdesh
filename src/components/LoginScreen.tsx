import { useState } from 'react'
import { CLASSES } from '../classes'
import { login } from '../auth/session'

export default function LoginScreen() {
  const [classId, setClassId] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!classId) return
    setSubmitting(true)
    setError(null)
    const result = await login(classId, phone, code)
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-lg font-extrabold text-slate-900">כיתת ענן</h1>
        <p className="mb-5 text-sm text-slate-500">התחברות עם מספר טלפון וקוד שקיבלת מהמורה</p>

        {!classId ? (
          <div className="flex flex-col gap-2">
            {Object.values(CLASSES).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClassId(c.id)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-start text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:bg-brand-50"
              >
                {c.className} · {c.schoolName}
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setClassId(null)
                setError(null)
              }}
              className="mb-3 text-xs font-semibold text-brand-600"
            >
              ← בחירת כיתה אחרת
            </button>
            <div className="flex flex-col gap-3">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="מספר טלפון"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="קוד"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
              <button
                type="button"
                onClick={submit}
                disabled={submitting || !phone.trim() || !code.trim()}
                className="rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                {submitting ? 'מתחברת...' : 'התחברות'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
