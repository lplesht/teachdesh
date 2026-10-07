import { useEffect, useRef, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, ensureSignedIn } from '../firebase'
import type { AccessEntry } from '../firestoreData'

// One class this device is logged in to. Holds only { classId, phone } -
// never role/displayName, which always come from the matching access doc
// (see useMyAccess below) so the client can never claim its own role.
export interface Membership {
  classId: string
  phone: string
}

export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function membershipsCollection(uid: string) {
  return collection(db!, 'sessions', uid, 'classes')
}

function membershipDoc(uid: string, classId: string) {
  return doc(db!, 'sessions', uid, 'classes', classId)
}

// 'loading' until anonymous auth + the first Firestore read resolve;
// afterwards the list of classes this device is logged in to (empty = not
// logged in anywhere).
export function useMemberships(): 'loading' | Membership[] {
  const [memberships, setMemberships] = useState<'loading' | Membership[]>('loading')

  useEffect(() => {
    if (!db || !auth) {
      setMemberships([])
      return
    }
    let unsub: (() => void) | undefined
    void ensureSignedIn().then(() => {
      const uid = auth!.currentUser?.uid
      if (!uid) {
        setMemberships([])
        return
      }
      unsub = onSnapshot(
        membershipsCollection(uid),
        // Firestore applies writes to the local cache optimistically,
        // before the server has accepted or rejected them - so a login
        // with a wrong code briefly shows up here as if it had succeeded.
        // Skipping docs with pending writes waits for the server-confirmed
        // version, so a rejected login never flashes a false "logged in"
        // (which would unmount the login screen and lose its error).
        // includeMetadataChanges is required: the pending->confirmed
        // transition has identical data, so without it the confirmation
        // would never fire this listener at all.
        { includeMetadataChanges: true },
        (snap) => {
          setMemberships(
            snap.docs
              .filter((d) => !d.metadata.hasPendingWrites)
              .map((d) => ({ classId: d.id, phone: d.data().phone as string }))
              .sort((x, y) => x.classId.localeCompare(y.classId)),
          )
        },
      )
    })
    return () => unsub?.()
  }, [])

  return memberships
}

const ACTIVE_CLASS_KEY = 'teachdesh_active_class'

// Which of the joined classes is currently open. The choice is remembered
// per device; if it points at a class that is no longer joined (or was never
// chosen) the first joined class is used instead.
export function useActiveMembership(
  memberships: 'loading' | Membership[],
): ['loading' | Membership | null, (classId: string) => void] {
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

  if (memberships === 'loading') return ['loading', setActive]
  return [memberships.find((m) => m.classId === desired) ?? memberships[0] ?? null, setActive]
}

function membershipKeyOf(membership: Membership | 'loading' | null): string | null {
  return membership === 'loading' || membership === null ? null : `${membership.classId}:${membership.phone}`
}

// Looks up role/displayName for the active membership by reading its matching
// access doc - this is the *only* source of truth for role in the UI, same
// as the security rules use server-side.
//
// Reports 'loading' (via the ref check below) until the lookup has actually
// settled *for the current membership's identity* - not just "whatever `access`
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

export function useMyAccess(session: Membership | 'loading' | null): AccessEntry | 'loading' | null {
  const [access, setAccess] = useState<AccessEntry | 'loading' | null>('loading')
  const resolvedForKey = useRef<string | null>(null)
  const sessionKey = membershipKeyOf(session)
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

// Creates this class's membership doc; the security rule itself checks
// `code` against the stored access doc for (classId, phone) and rejects the
// write if it doesn't match, so a wrong code never joins a class - no
// separate server-side check needed.
export async function login(classId: string, phoneRaw: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!db || !auth) return { ok: false, error: 'האפליקציה לא מחוברת למסד נתונים' }

  const phone = normalizePhone(phoneRaw)
  if (!phone || !code.trim()) return { ok: false, error: 'צריך להזין מספר טלפון וקוד' }

  await ensureSignedIn()
  const uid = auth.currentUser?.uid
  if (!uid) return { ok: false, error: 'ההתחברות נכשלה, נסי לרענן את הדף' }

  try {
    await setDoc(membershipDoc(uid, classId), { phone, code: code.trim() })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: isPermissionDenied(err) ? 'מספר טלפון או קוד שגויים' : 'שגיאה בהתחברות, נסי שוב' }
  }
}

export async function logout(classId: string): Promise<void> {
  if (!db || !auth?.currentUser) return
  await deleteDoc(membershipDoc(auth.currentUser.uid, classId))
}

export async function logoutAll(classIds: string[]): Promise<void> {
  await Promise.all(classIds.map((id) => logout(id)))
}
