import { useEffect, useState } from 'react'
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

// Looks up role/displayName for the current session by reading its matching
// access doc - this is the *only* source of truth for role in the UI, same
// as the security rules use server-side.
export function useMyAccess(session: Session | 'loading' | null): AccessEntry | 'loading' | null {
  const [access, setAccess] = useState<AccessEntry | 'loading' | null>('loading')

  useEffect(() => {
    if (session === 'loading') {
      setAccess('loading')
      return
    }
    if (!db || !session) {
      setAccess(null)
      return
    }
    return onSnapshot(doc(db, 'classes', session.classId, 'access', session.phone), (snap) => {
      const data = snap.data()
      setAccess(data ? { phone: session.phone, code: data.code, role: data.role, displayName: data.displayName } : null)
    })
  }, [session])

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
