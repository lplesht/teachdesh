import { useEffect, useRef, useState } from 'react'
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, ensureSignedIn } from '../firebase'
import type { AccessEntry } from '../firestoreData'

export interface Session {
  classId: string
  phone: string
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function sessionDoc(uid: string) {
  return doc(db!, 'sessions', uid)
}

// 'loading' until anonymous auth + the first Firestore read resolve; null
// once resolved with no session (not logged in); a Session once logged in.
// Deliberately holds only { classId, phone } - never role/displayName,
// which always come from the matching access doc (see useMyAccess below)
// so the client can never claim its own role.
export function useSession(): 'loading' | Session | null {
  const [session, setSession] = useState<'loading' | Session | null>('loading')

  useEffect(() => {
    if (!db || !auth) {
      setSession(null)
      return
    }
    let unsubSession: (() => void) | undefined
    void ensureSignedIn().then(() => {
      const uid = auth!.currentUser?.uid
      if (!uid) {
        setSession(null)
        return
      }
      unsubSession = onSnapshot(sessionDoc(uid), (snap) => {
        const data = snap.data()
        setSession(data ? { classId: data.classId, phone: data.phone } : null)
      })
    })
    return () => unsubSession?.()
  }, [])

  return session
}

function sessionKeyOf(session: Session | 'loading' | null): string | null {
  return session === 'loading' || session === null ? null : `${session.classId}:${session.phone}`
}

// Looks up role/displayName for the current session by reading its matching
// access doc - this is the *only* source of truth for role in the UI, same
// as the security rules use server-side.
//
// Reports 'loading' (via the ref check below) until the lookup has actually
// settled *for the current session's identity* - not just "whatever `access`
// happened to hold before `session` changed". Without that guard, right
// after logging in there's one render where `session` is already the new,
// real session but `access` still holds its previous value (null, from
// being logged out) because this hook's own effect hasn't run yet - a
// momentary false "access confirmed absent" that looks identical to a
// genuinely removed access doc to anything reading both values together
// (e.g. a stale-session cleanup effect), causing it to immediately delete
// the session it just created.
const MAX_ACCESS_RETRIES = 8
const ACCESS_RETRY_DELAY_MS = 400

export function useMyAccess(session: Session | 'loading' | null): AccessEntry | 'loading' | null {
  const [access, setAccess] = useState<AccessEntry | 'loading' | null>('loading')
  const resolvedForKey = useRef<string | null>(null)
  const sessionKey = sessionKeyOf(session)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (session === 'loading') {
      setAccess('loading')
      resolvedForKey.current = null
      return
    }
    if (!db || !session) {
      setAccess(null)
      resolvedForKey.current = null
      return
    }

    let cancelled = false
    let attempt = retryTick
    const unsub = onSnapshot(
      doc(db, 'classes', session.classId, 'access', session.phone),
      (snap) => {
        const data = snap.data()
        resolvedForKey.current = sessionKey
        setAccess(data ? { phone: session.phone, code: data.code, role: data.role, displayName: data.displayName } : null)
      },
      () => {
        // The access doc's read rule depends on sessions/{uid} that was
        // just created a moment ago - very occasionally the rule engine
        // evaluates against a not-yet-visible write and rejects this read
        // even though the session is genuinely valid. Retry a few times
        // (rather than dying silently) before giving up.
        if (cancelled || attempt >= MAX_ACCESS_RETRIES) return
        attempt += 1
        setTimeout(() => {
          if (!cancelled) setRetryTick((t) => t + 1)
        }, ACCESS_RETRY_DELAY_MS)
      },
    )
    return () => {
      cancelled = true
      unsub()
    }
  }, [session, retryTick])

  if (resolvedForKey.current !== sessionKey) return 'loading'
  return access
}

function isPermissionDenied(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'permission-denied'
}

// Creates the session doc; the security rule itself checks `code` against
// the stored access doc for (classId, phone) and rejects the write if it
// doesn't match, so a wrong code never creates a session - no separate
// server-side check needed.
export async function login(classId: string, phoneRaw: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!db || !auth) return { ok: false, error: 'האפליקציה לא מחוברת למסד נתונים' }

  const phone = normalizePhone(phoneRaw)
  if (!phone || !code.trim()) return { ok: false, error: 'צריך להזין מספר טלפון וקוד' }

  await ensureSignedIn()
  const uid = auth.currentUser?.uid
  if (!uid) return { ok: false, error: 'ההתחברות נכשלה, נסי לרענן את הדף' }

  try {
    await setDoc(sessionDoc(uid), { classId, phone, code: code.trim() })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: isPermissionDenied(err) ? 'מספר טלפון או קוד שגויים' : 'שגיאה בהתחברות, נסי שוב' }
  }
}

export async function logout(): Promise<void> {
  if (!db || !auth?.currentUser) return
  await deleteDoc(sessionDoc(auth.currentUser.uid))
}
