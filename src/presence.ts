import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, ensureSignedIn } from './firebase'

const HEARTBEAT_INTERVAL_MS = 30_000
// A bit over 2 missed heartbeats' worth of slack, so a slow network tick
// doesn't flip someone to "offline" between two on-time beats.
const ONLINE_THRESHOLD_MS = 90_000

function presenceDoc(classId: string, phone: string) {
  return doc(db!, 'classes', classId, 'presence', phone)
}

// Approximates "who's online" the simple way: while the app is open, this
// viewer's phone writes a fresh timestamp every 30s (plus immediately on
// mount and on tab refocus). Other viewers derive online/last-seen from how
// recent that timestamp is (see isOnline/formatRelativeLastSeen) rather than
// a true disconnect signal, which would need a second Firebase product
// (Realtime Database) just for this.
export function usePresenceHeartbeat(classId: string | undefined, phone: string | undefined, displayName: string): void {
  useEffect(() => {
    if (!db || !classId || !phone) return
    let cancelled = false

    const beat = () => {
      void ensureSignedIn().then(() => {
        if (cancelled) return
        void setDoc(presenceDoc(classId, phone), { displayName, lastActive: serverTimestamp() })
      })
    }

    beat()
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') beat()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [classId, phone, displayName])
}

// phone -> last heartbeat time (ms since epoch), for everyone in the class.
export function usePresenceList(classId: string | undefined): Record<string, number> {
  const [map, setMap] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!db || !classId) return
    return onSnapshot(collection(db, 'classes', classId, 'presence'), (snap) => {
      const next: Record<string, number> = {}
      for (const d of snap.docs) {
        const ts = d.data().lastActive
        next[d.id] = typeof ts?.toMillis === 'function' ? ts.toMillis() : 0
      }
      setMap(next)
    })
  }, [classId])
  return map
}

export function isOnline(lastActive: number | undefined, now: number = Date.now()): boolean {
  return !!lastActive && now - lastActive < ONLINE_THRESHOLD_MS
}

export function formatRelativeLastSeen(ts: number, now: number = Date.now()): string {
  const diffMin = Math.floor(Math.max(0, now - ts) / 60_000)
  if (diffMin < 1) return 'לפני רגע'
  if (diffMin < 60) return `לפני ${diffMin} דק׳`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `לפני ${diffHr} שע׳`
  return `לפני ${Math.floor(diffHr / 24)} ימים`
}
