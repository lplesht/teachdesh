import { useEffect, useState } from 'react'
import { enablePushNotifications } from '../push'

interface Props {
  classId: string
  phone: string
  displayName: string
}

const DISMISSED_KEY = 'teachdesh_push_dismissed'

export default function PushPrompt({ classId, phone, displayName }: Props) {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only worth asking while the browser hasn't already decided (granted or
  // denied), and not if this viewer already said "not now" once before.
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
    try {
      if (localStorage.getItem(DISMISSED_KEY)) return
    } catch {
      // ignore - private browsing etc.
    }
    setVisible(true)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }

  const enable = async () => {
    setBusy(true)
    setError(null)
    const result = await enablePushNotifications(classId, phone, displayName)
    setBusy(false)
    if (result.ok) setVisible(false)
    else setError(result.error)
  }

  if (!visible) return null

  return (
    <div className="mx-3 mt-2 flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700">
      <span>{error ?? 'לקבל התראה כשיש עדכון חדש בכיתה?'}</span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="rounded-full bg-brand-600 px-2.5 py-1 font-bold text-white disabled:opacity-60"
        >
          {busy ? '...' : 'אפשר'}
        </button>
        <button type="button" onClick={dismiss} className="rounded-full px-2 py-1 font-semibold text-brand-500">
          לא עכשיו
        </button>
      </div>
    </div>
  )
}
