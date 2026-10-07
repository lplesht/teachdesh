import { useState } from 'react'
import { login } from '../auth/session'

const inputClass =
  'rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

// Phone + code only: which classes the person belongs to is decided by the
// admin when adding them, so there's nothing to choose here.
export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    setError(null)
    const result = await login(phone, code)
    setSubmitting(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6" dir="rtl">
      <form
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <h1 className="mb-1 text-lg font-extrabold text-slate-900">כיתת ענן</h1>
        <p className="mb-5 text-sm text-slate-500">התחברות עם מספר הטלפון והקוד שקיבלת</p>

        <div className="flex flex-col gap-3">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="מספר טלפון"
            className={inputClass}
          />
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="קוד" className={inputClass} />
          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !phone.trim() || !code.trim()}
            className="rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            {submitting ? 'מתחברת...' : 'התחברות'}
          </button>
        </div>
      </form>
    </div>
  )
}
