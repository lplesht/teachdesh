import { useState } from 'react'
import { findClassByNumber, type ClassInfo } from '../classes'
import { login } from '../auth/session'

export default function LoginScreen() {
  const [classNumber, setClassNumber] = useState('')
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [classError, setClassError] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submitClassNumber = () => {
    const found = findClassByNumber(Number(classNumber))
    if (!found) {
      setClassError('מספר כיתה לא נכון')
      return
    }
    setClassError(null)
    setClassInfo(found)
  }

  const submit = async () => {
    if (!classInfo) return
    setSubmitting(true)
    setError(null)
    const result = await login(classInfo.id, phone, code)
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-lg font-extrabold text-slate-900">כיתת ענן</h1>
        <p className="mb-5 text-sm text-slate-500">התחברות עם מספר טלפון וקוד שקיבלת מהמורה</p>

        {!classInfo ? (
          <div className="flex flex-col gap-3">
            <input
              type="number"
              inputMode="numeric"
              value={classNumber}
              onChange={(e) => {
                setClassNumber(e.target.value)
                setClassError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitClassNumber()}
              placeholder="מספר כיתה"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {classError && <p className="text-xs font-semibold text-rose-600">{classError}</p>}
            <button
              type="button"
              onClick={submitClassNumber}
              disabled={!classNumber.trim()}
              className="rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              המשך
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setClassInfo(null)
                setError(null)
              }}
              className="mb-3 text-xs font-semibold text-brand-600"
            >
              ← כיתה {classInfo.className} · שינוי
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
