import { useEffect, useRef, useState } from 'react'
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, ensureSignedIn } from '../firebase'
import { INVALID_PHONE_MESSAGE, isValidIsraeliPhone, normalizePhone } from '../phone'
import { userFromData, type UserEntry } from '../firestoreData'
import type { Role } from '../data'

// One class the logged-in person belongs to, with their role in it. Always
// derived from their users/{phone} doc (see useMyUser) - never stored on the
// device, so the client can never claim its own role or classes.
export interface Membership {
  classId: string
  role: Role
}

export interface Session {
  phone: string
  // Kept so the client can notice, on its own, that the admin has since
  // changed this person's code (the rules enforce it server-side too).
  code: string
}

function sessionDoc(uid: string) {
  return doc(db!, 'sessions', uid)
}

// 'loading' until anonymous auth + the first Firestore read resolve; then
// null (not logged in) or the phone this device logged in with.
export function useSession(): 'loading' | Session | null {
  const [session, setSession] = useState<'loading' | Session | null>('loading')

  useEffect(() => {
    if (!db || !auth) {
      setSession(null)
      return
    }
    let unsub: (() => void) | undefined
    void ensureSignedIn().then(() => {
      const uid = auth!.currentUser?.uid
      if (!uid) {
        setSession(null)
        return
      }
      unsub = onSnapshot(
        sessionDoc(uid),
        // Firestore applies writes to the local cache optimistically, before
        // the server has accepted or rejected them - so a login with a wrong
        // code briefly shows up here as if it had succeeded. Skipping a
        // doc with pending writes waits for the server-confirmed version, so
        // a rejected login never flashes a false "logged in" (which would
        // unmount the login screen and lose its error). includeMetadataChanges
        // is required: the pending->confirmed transition has identical data,
        // so without it the confirmation would never fire this listener.
        { includeMetadataChanges: true },
        (snap) => {
          if (snap.exists() && snap.metadata.hasPendingWrites) return
          setSession(snap.exists() ? { phone: snap.data().phone as string, code: snap.data().code as string } : null)
        },
      )
    })
    return () => unsub?.()
  }, [])

  return session
}

const MAX_USER_RETRIES = 8
const USER_RETRY_DELAY_MS = 400

// The logged-in person's own users/{phone} doc: name, role per class, admin
// flag. This is the *only* source of truth for those in the UI, same as the
// security rules use server-side.
//
// null means "confirmed not valid any more" - the user was deleted or their
// code changed (the rules then refuse the read, and the client double-checks
// the code itself), so App logs this device out.
// 'loading' is reported until the lookup has settled *for the current phone*,
// so a stale value from before logging in can't be mistaken for an answer.
export function useMyUser(session: 'loading' | Session | null): UserEntry | 'loading' | null {
  const [state, setState] = useState<{ key: string; user: UserEntry | null } | null>(null)
  const [retryTick, setRetryTick] = useState(0)
  const retries = useRef(0)
  const phone = session === 'loading' || session === null ? null : session.phone
  const sessionCode = session === 'loading' || session === null ? null : session.code
  // Identifies *this* login, so a result left over from an earlier login of
  // the same phone (before the code changed) can't pass for the current one.
  const loginKey = phone && sessionCode ? `${phone}:${sessionCode}` : null

  // A fresh login starts with a fresh retry budget.
  useEffect(() => {
    retries.current = 0
  }, [phone, sessionCode])

  useEffect(() => {
    if (!db || !phone) return
    let cancelled = false
    const unsub = onSnapshot(
      doc(db, 'users', phone),
      (snap) => {
        // A cached copy can only vouch for a login, never end one: it may be
        // from before the code changed (or the user was removed), and the
        // server's answer is still on its way.
        if (snap.metadata.fromCache && (!snap.exists() || snap.data().code !== sessionCode)) return
        // A cached copy says nothing about whether the server still accepts
        // this read, so only a server-confirmed snapshot clears the retries.
        if (!snap.metadata.fromCache) retries.current = 0
        setState({ key: `${phone}:${sessionCode}`, user: snap.exists() ? userFromData(phone, snap.data()) : null })
      },
      () => {
        // Right after logging in, the read rule can very occasionally be
        // evaluated against a not-yet-visible session write and refuse a
        // valid login. Retry a few times before concluding it's really gone.
        if (cancelled) return
        if (retries.current < MAX_USER_RETRIES) {
          retries.current += 1
          setTimeout(() => {
            if (!cancelled) setRetryTick((t) => t + 1)
          }, USER_RETRY_DELAY_MS)
        } else {
          setState({ key: `${phone}:${sessionCode}`, user: null })
        }
      },
    )
    return () => {
      cancelled = true
      unsub()
    }
  }, [phone, sessionCode, retryTick])

  if (session === 'loading') return 'loading'
  if (session === null) return null
  if (state?.key !== loginKey) return 'loading'
  // The code this device logged in with is no longer the user's code.
  if (state.user && state.user.code !== sessionCode) return null
  return state.user
}

export function membershipsOf(user: UserEntry): Membership[] {
  return Object.entries(user.classes)
    .map(([classId, role]) => ({ classId, role }))
    .sort((a, b) => a.classId.localeCompare(b.classId))
}

const ACTIVE_CLASS_KEY = 'teachdesh_active_class'

// Which of the person's classes is currently open. The choice is remembered
// per device; if it points at a class they no longer belong to (or was never
// chosen) the first one is used instead.
export function useActiveMembership(
  memberships: Membership[],
): [Membership | null, (classId: string) => void] {
  const [desired, setDesired] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_CLASS_KEY)
    } catch {
      return null
    }
  })

  const setActive = (classId: string) => {
    setDesired(classId)
    try {
      localStorage.setItem(ACTIVE_CLASS_KEY, classId)
    } catch {
      // ignore - private browsing etc.
    }
  }

  return [memberships.find((m) => m.classId === desired) ?? memberships[0] ?? null, setActive]
}

function isPermissionDenied(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'permission-denied'
}

// Logs this device in: the security rule itself checks `code` against the
// stored users/{phone}.code and rejects the write if it doesn't match (or the
// phone doesn't exist), so a wrong login never creates a session - no
// separate server-side check needed. Which classes the person lands in comes
// from their users doc, not from anything chosen here.
export async function login(phoneRaw: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!db || !auth) return { ok: false, error: 'האפליקציה לא מחוברת למסד נתונים' }

  const phone = normalizePhone(phoneRaw)
  if (!isValidIsraeliPhone(phone)) return { ok: false, error: INVALID_PHONE_MESSAGE }
  if (!code.trim()) return { ok: false, error: 'צריך להזין מספר טלפון וקוד' }

  await ensureSignedIn()
  const uid = auth.currentUser?.uid
  if (!uid) return { ok: false, error: 'ההתחברות נכשלה, נסי לרענן את הדף' }

  try {
    await setDoc(sessionDoc(uid), { phone, code: code.trim() })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: isPermissionDenied(err) ? 'מספר טלפון או קוד שגויים' : 'שגיאה בהתחברות, נסי שוב' }
  }
}

export async function logout(): Promise<void> {
  if (!db || !auth?.currentUser) return
  await deleteDoc(sessionDoc(auth.currentUser.uid))
}
