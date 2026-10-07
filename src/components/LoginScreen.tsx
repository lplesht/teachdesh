import { useState } from 'react'
import { classesOfSchool, listSchools, type ClassInfo } from '../classes'
import { login } from '../auth/session'

interface Props {
  // Set when adding another class to an already logged-in device.
  defaultPhone?: string
  joinedClassIds?: string[]
  onCancel?: () => void
  onJoined?: (classId: string) => void
}

const inputClass =
  'rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export default function LoginScreen({ defaultPhone = '', joinedClassIds = [], onCancel, onJoined }: Props) {
  const [school, setSchool] = useState<string | null>(null)
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [phone, setPhone] = useState(defaultPhone)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!classInfo) return
    setSubmitting(true)
    setError(null)
    const result = await login(classInfo.id, phone, code)
    setSubmitting(false)
    if (!result.ok) setError(result.error)
    else onJoined?.(classInfo.id)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6" dir="rtl">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="mb-1 text-lg font-extrabold text-slate-900">{onCancel ? 'הוספת כיתה' : 'כיתת ענן'}</h1>
        <p className="mb-5 text-sm text-slate-500">
          {!school ? 'בחרו בית ספר' : !classInfo ? 'בחרו כיתה' : 'התחברות עם מספר טלפון וקוד שקיבלת מהמורה'}
        </p>

        {!school && (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {listSchools().map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setSchool(name)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-start text-sm font-bold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {school && !classInfo && (
          <>
            <button type="button" onClick={() => setSchool(null)} className="mb-3 text-xs font-semibold text-brand-600">
              ← {school} · שינוי
            </button>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {classesOfSchool(school).map((c) => {
                const joined = joinedClassIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={joined}
                    onClick={() => setClassInfo(c)}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-start text-sm font-bold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <span>
                      כיתה {c.className} - מחנכת {c.teacherName}
                    </span>
                    {joined && <span className="shrink-0 text-[11px] font-semibold">מחובר</span>}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {school && classInfo && (
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
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="מספר טלפון" className={inputClass} />
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="קוד" className={inputClass} />
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

        {onCancel && (
          <button type="button" onClick={onCancel} className="mt-4 w-full text-xs font-semibold text-slate-500">
            חזרה
          </button>
        )}
      </div>
    </div>
  )
}
