import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db, ensureSignedIn } from './firebase'
import type { DestinationTag } from './classify'
import type { AnnouncementMeta, AssignmentMeta, EventMeta } from './classify'
import type { AnnouncementCard, AssignmentCard, ChatMessage, EventCard, Photo, Role } from './data'
import { toISO, weekdayName } from './dateUtils'

// Every collection here lives under a specific class - classId is threaded
// through explicitly (rather than a fixed constant) so the same app instance
// can serve more than one class's data, keyed by the signed-in session.
function classCollection(classId: string, name: string) {
  return collection(db!, 'classes', classId, name)
}

function classDoc(classId: string, name: string, id: string) {
  return doc(db!, 'classes', classId, name, id)
}

function localRsvpKey(eventId: string): string {
  return `teachdesh_rsvp_${eventId}`
}

function getLocalRsvp(eventId: string): 'yes' | 'no' | null {
  try {
    const v = localStorage.getItem(localRsvpKey(eventId))
    return v === 'yes' || v === 'no' ? v : null
  } catch {
    return null
  }
}

// --- Live reads ---

export function useMessages(classId: string | undefined): ChatMessage[] {
  const [items, setItems] = useState<ChatMessage[]>([])
  useEffect(() => {
    if (!db || !classId) return
    const q = query(classCollection(classId, 'messages'), orderBy('ts', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          const likedBy = (data.likedBy ?? {}) as Record<string, string>
          return {
            id: d.id,
            from: data.from,
            authorName: data.authorName,
            text: data.text,
            time: data.time,
            ts: data.ts ?? 0,
            // Falls back to the old plain counter for messages liked before
            // per-user tracking existed - they just won't have names to show.
            likes: Object.keys(likedBy).length || data.likes || 0,
            likedBy,
            readBy: data.readBy ?? 0,
            photoUrl: data.photoUrl ?? undefined,
            tags: (data.tags ?? []) as DestinationTag[],
          }
        }),
      )
    })
  }, [classId])
  return items
}

export function useEvents(classId: string | undefined): EventCard[] {
  const [items, setItems] = useState<EventCard[]>([])
  useEffect(() => {
    if (!db || !classId) return
    const q = query(classCollection(classId, 'events'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            title: data.title,
            date: data.date,
            dateIso: data.dateIso ?? undefined,
            time: data.time ?? undefined,
            location: data.location,
            icon: data.icon,
            rsvpYes: data.rsvpYes ?? 0,
            rsvpNo: data.rsvpNo ?? 0,
            myRsvp: getLocalRsvp(d.id),
            sourceMessageId: data.sourceMessageId ?? undefined,
            ts: data.ts ?? 0,
          }
        }),
      )
    })
  }, [classId])
  return items
}

export function useAssignments(classId: string | undefined): AssignmentCard[] {
  const [items, setItems] = useState<AssignmentCard[]>([])
  useEffect(() => {
    if (!db || !classId) return
    const q = query(classCollection(classId, 'assignments'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            subject: data.subject,
            source: data.source ?? undefined,
            pages: data.pages ?? undefined,
            content: data.content,
            icon: data.icon,
            dayIso: data.dayIso ?? '',
            dayLabel: data.dayLabel ?? '',
            weekday: data.weekday ?? '',
            ts: data.ts ?? 0,
            sourceMessageId: data.sourceMessageId ?? undefined,
          }
        }),
      )
    })
  }, [classId])
  return items
}

export function useAnnouncements(classId: string | undefined): AnnouncementCard[] {
  const [items, setItems] = useState<AnnouncementCard[]>([])
  useEffect(() => {
    if (!db || !classId) return
    const q = query(classCollection(classId, 'announcements'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            text: data.text,
            icon: data.icon,
            dayIso: data.dayIso ?? '',
            dayLabel: data.dayLabel ?? '',
            weekday: data.weekday ?? '',
            ts: data.ts ?? 0,
            sourceMessageId: data.sourceMessageId ?? undefined,
          }
        }),
      )
    })
  }, [classId])
  return items
}

export function usePhotos(classId: string | undefined): Photo[] {
  const [items, setItems] = useState<Photo[]>([])
  useEffect(() => {
    if (!db || !classId) return
    const q = query(classCollection(classId, 'photos'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            caption: data.caption,
            date: data.date,
            gradient: '',
            emoji: '',
            imageUrl: data.imageUrl,
            sourceMessageId: data.sourceMessageId ?? undefined,
          }
        }),
      )
    })
  }, [classId])
  return items
}

export function useRoster(classId: string | undefined): string[] {
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    if (!db || !classId) return
    return onSnapshot(classDoc(classId, 'meta', 'roster'), (snap) => {
      const data = snap.data() as DocumentData | undefined
      setNames(data?.names ?? [])
    })
  }, [classId])
  return names
}

// --- Users (admin only) ---
//
// One doc per person at users/{phone}: the phone is the id (so it is unique by
// construction), and it carries the single login code plus every class that
// person belongs to with their role there. Only the admin can read the whole
// collection or write to it - see firestore.rules and UserManagerModal.

export interface UserEntry {
  phone: string
  displayName: string
  code: string
  classes: Record<string, Role>
  admin: boolean
}

function userDoc(phone: string) {
  return doc(db!, 'users', phone)
}

export function userFromData(phone: string, data: DocumentData): UserEntry {
  return {
    phone,
    displayName: data.displayName ?? '',
    code: data.code ?? '',
    classes: (data.classes ?? {}) as Record<string, Role>,
    admin: data.admin === true,
  }
}

export function useUsersList(): UserEntry[] {
  const [items, setItems] = useState<UserEntry[]>([])
  useEffect(() => {
    if (!db) return
    return onSnapshot(
      collection(db, 'users'),
      (snap) => setItems(snap.docs.map((d) => userFromData(d.id, d.data())).sort((a, b) => a.displayName.localeCompare(b.displayName, 'he'))),
      () => setItems([]),
    )
  }, [])
  return items
}

// Never overwrites: the phone is the unique key, so adding one that already
// exists is refused instead of silently replacing someone's code and classes.
export async function createUserDoc(entry: Omit<UserEntry, 'admin'>): Promise<'ok' | 'exists'> {
  await ensureSignedIn()
  return runTransaction(db!, async (tx) => {
    const ref = userDoc(entry.phone)
    if ((await tx.get(ref)).exists()) return 'exists' as const
    tx.set(ref, { displayName: entry.displayName, code: entry.code, classes: entry.classes })
    return 'ok' as const
  })
}

// updateDoc (not setDoc) so the admin flag on the one admin's own doc is left
// alone, and `classes` is replaced as a whole so removed classes really go.
export async function updateUserDoc(entry: Omit<UserEntry, 'admin'>): Promise<void> {
  await ensureSignedIn()
  await updateDoc(userDoc(entry.phone), { displayName: entry.displayName, code: entry.code, classes: entry.classes })
}

// Someone removed from a class must also stop being a (stale) push recipient
// and "online" there.
export async function clearClassFootprint(classId: string, phone: string): Promise<void> {
  await Promise.all([
    deleteDoc(classDoc(classId, 'pushTokens', phone)).catch(() => {}),
    deleteDoc(classDoc(classId, 'presence', phone)).catch(() => {}),
  ])
}

export async function deleteUserDoc(entry: UserEntry): Promise<void> {
  await ensureSignedIn()
  await deleteDoc(userDoc(entry.phone))
  await Promise.all(Object.keys(entry.classes).map((classId) => clearClassFootprint(classId, entry.phone)))
}

export interface LegacyImportReport {
  created: number
  merged: number
  conflicts: string[]
  skipped: string[]
}

// One-time move from the old per-class access lists (classes/{id}/access) to
// users/. People who appear in several classes become one user with several
// classes; if they had different codes per class the first class's code wins
// and the clash is reported so the admin can tell them. Existing users are
// never overwritten - only given the classes they were missing.
export async function importLegacyAccess(classIds: string[], isValidPhone: (phone: string) => boolean): Promise<LegacyImportReport> {
  await ensureSignedIn()
  const report: LegacyImportReport = { created: 0, merged: 0, conflicts: [], skipped: [] }
  const found = new Map<string, { displayName: string; code: string; classes: Record<string, Role> }>()

  for (const classId of classIds) {
    const snap = await getDocs(classCollection(classId, 'access'))
    for (const d of snap.docs) {
      const data = d.data()
      const role: Role = data.role === 'teacher' ? 'teacher' : 'parent'
      const prev = found.get(d.id)
      if (!prev) {
        found.set(d.id, { displayName: data.displayName ?? d.id, code: String(data.code ?? ''), classes: { [classId]: role } })
      } else {
        prev.classes[classId] = role
        if (String(data.code ?? '') !== prev.code) report.conflicts.push(`${prev.displayName} (${d.id})`)
      }
    }
  }

  for (const [phone, p] of found) {
    if (!isValidPhone(phone) || p.code.length < 4 || p.code.length > 12) {
      report.skipped.push(`${p.displayName} (${phone})`)
      continue
    }
    const existing = await getDoc(userDoc(phone))
    if (existing.exists()) {
      const classes = { ...p.classes, ...((existing.data().classes ?? {}) as Record<string, Role>) }
      await updateDoc(userDoc(phone), { classes })
      report.merged += 1
    } else {
      await setDoc(userDoc(phone), { displayName: p.displayName, code: p.code, classes: p.classes })
      report.created += 1
    }
  }
  return report
}

// --- Writes ---

export async function sendMessageDoc(
  classId: string,
  from: 'teacher' | 'parent',
  fromPhone: string,
  authorName: string,
  text: string,
  time: string,
): Promise<{ id: string }> {
  await ensureSignedIn()

  const docRef = await addDoc(classCollection(classId, 'messages'), {
    from,
    fromPhone,
    authorName,
    text,
    time,
    likedBy: {},
    readBy: 0,
    photoUrl: null,
    tags: [],
    ts: Date.now(),
  })

  return { id: docRef.id }
}

export async function updateMessageTags(classId: string, id: string, tags: DestinationTag[]): Promise<void> {
  await ensureSignedIn()
  await updateDoc(classDoc(classId, 'messages', id), { tags })
}

// Toggles this viewer's own like - the security rule only lets a parent
// touch her own key inside likedBy, never anyone else's.
export async function toggleLikeMessageDoc(
  classId: string,
  id: string,
  phone: string,
  displayName: string,
  currentlyLiked: boolean,
): Promise<void> {
  await ensureSignedIn()
  await updateDoc(classDoc(classId, 'messages', id), {
    [`likedBy.${phone}`]: currentlyLiked ? deleteField() : displayName,
  })
}

// Deletes the message plus everything it was routed to (events, assignments,
// announcements, photos) - a teacher retracting a message shouldn't leave
// orphaned cards behind on the other tabs.
const DERIVED_COLLECTIONS = ['events', 'assignments', 'announcements', 'photos']

export async function deleteMessageDoc(classId: string, id: string): Promise<void> {
  await ensureSignedIn()

  const derivedSnaps = await Promise.all(
    DERIVED_COLLECTIONS.map((name) => getDocs(query(classCollection(classId, name), where('sourceMessageId', '==', id)))),
  )

  const batch = writeBatch(db!)
  for (const snap of derivedSnaps) {
    for (const d of snap.docs) batch.delete(d.ref)
  }
  batch.delete(classDoc(classId, 'messages', id))
  await batch.commit()
}

export async function addEventDoc(classId: string, meta: EventMeta, sourceMessageId: string): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection(classId, 'events'), {
    title: meta.title,
    date: meta.date,
    dateIso: meta.dateIso ?? null,
    time: meta.time ?? null,
    location: meta.location,
    icon: meta.icon,
    rsvpYes: 0,
    rsvpNo: 0,
    sourceMessageId,
    ts: Date.now(),
  })
}

// The bubble a teacher's assignment lands in is the day it was *given*
// (the message's send time), not any date mentioned in its text - so that
// gets computed here from `sentAt`, independent of what the classifier found.
export async function addAssignmentDoc(
  classId: string,
  meta: AssignmentMeta,
  sourceMessageId: string,
  sentAt: Date,
): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection(classId, 'assignments'), {
    subject: meta.subject,
    source: meta.source ?? null,
    pages: meta.pages ?? null,
    content: meta.content,
    icon: meta.icon,
    dayIso: toISO(sentAt),
    dayLabel: `${sentAt.getDate()}.${sentAt.getMonth() + 1}`,
    weekday: weekdayName(sentAt),
    sourceMessageId,
    ts: sentAt.getTime(),
  })
}

// The bubble an announcement lands in is the day it was *sent* (the
// message's send time), not any date mentioned in its text ("bring this by
// tomorrow") - so that gets computed here from `sentAt`, same as assignments.
export async function addAnnouncementDoc(
  classId: string,
  meta: AnnouncementMeta,
  sourceMessageId: string,
  sentAt: Date,
): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection(classId, 'announcements'), {
    text: meta.text,
    icon: meta.icon,
    dayIso: toISO(sentAt),
    dayLabel: `${sentAt.getDate()}.${sentAt.getMonth() + 1}`,
    weekday: weekdayName(sentAt),
    sourceMessageId,
    ts: sentAt.getTime(),
  })
}

// RSVP counters are shared in Firestore; *which* answer this viewer gave is
// tracked locally only (no real per-parent accounts yet to store it against).
export async function rsvpEventDoc(classId: string, id: string, answer: 'yes' | 'no'): Promise<void> {
  await ensureSignedIn()
  const previous = getLocalRsvp(id)
  if (previous === answer) return

  const updates: Record<string, ReturnType<typeof increment>> = {}
  if (previous === 'yes') updates.rsvpYes = increment(-1)
  if (previous === 'no') updates.rsvpNo = increment(-1)
  updates[answer === 'yes' ? 'rsvpYes' : 'rsvpNo'] = increment(1)

  await updateDoc(classDoc(classId, 'events', id), updates)
  try {
    localStorage.setItem(localRsvpKey(id), answer)
  } catch {
    // ignore - private browsing etc.
  }
}

export async function updateRosterDoc(classId: string, names: string[]): Promise<void> {
  await ensureSignedIn()
  await setDoc(classDoc(classId, 'meta', 'roster'), { names })
}
