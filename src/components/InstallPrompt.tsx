import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

const DISMISS_KEY = 'teachdesh_install_tip_dismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

// Android/desktop Chrome fire `beforeinstallprompt`, letting us trigger the
// native install UI directly. iOS Safari has no such event - there, the
// only path is Share -> "הוסף למסך הבית", so we just show a one-time tip.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosTip, setShowIosTip] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isStandalone()) return

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (isIOS()) {
      try {
        if (!localStorage.getItem(DISMISS_KEY)) setShowIosTip(true)
      } catch {
        setShowIosTip(true)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismissIosTip = () => {
    setShowIosTip(false)
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore - private browsing etc.
    }
  }

  if (dismissed) return null

  if (deferred) {
    return (
      <button
        type="button"
        onClick={() => void deferred.prompt()}
        className="mx-3 mt-3 shrink-0 rounded-xl bg-brand-600 px-3.5 py-2 text-start text-[11px] font-bold text-white shadow-sm transition hover:bg-brand-700"
      >
        📲 התקן/י את האפליקציה למסך הבית
      </button>
    )
  }

  if (showIosTip) {
    return (
      <div className="mx-3 mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm">
        <span>להתקנה: לחצי על שיתוף ← "הוסף למסך הבית"</span>
        <button type="button" onClick={dismissIosTip} className="shrink-0 text-slate-300" aria-label="סגירה">
          ✕
        </button>
      </div>
    )
  }

  return null
}
