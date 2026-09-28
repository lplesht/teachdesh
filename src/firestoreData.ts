import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { CLASS_ID, db, ensureSignedIn } from './firebase'
import type { DestinationTag } from './classify'
import type { AnnouncementMeta, AssignmentMeta, EventMeta } from './classify'
import type { AnnouncementCard, AssignmentCard, ChatMessage, EventCard, Photo } from './data'

function classCollection(name: string) {
  return collection(db!, 'classes', CLASS_ID, name)
}

function classDoc(name: string, id: string) {
  return doc(db!, 'classes', CLASS_ID, name, id)
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

export function useMessages(): ChatMessage[] {
  const [items, setItems] = useState<ChatMessage[]>([])
  useEffect(() => {
    if (!db) return
    const q = query(classCollection('messages'), orderBy('ts', 'asc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            from: data.from,
            authorName: data.authorName,
            text: data.text,
            time: data.time,
            likes: data.likes ?? 0,
            readBy: data.readBy ?? 0,
            photoUrl: data.photoUrl ?? undefined,
            tags: (data.tags ?? []) as DestinationTag[],
          }
        }),
      )
    })
  }, [])
  return items
}

export function useEvents(): EventCard[] {
  const [items, setItems] = useState<EventCard[]>([])
  useEffect(() => {
    if (!db) return
    const q = query(classCollection('events'), orderBy('ts', 'desc'))
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
          }
        }),
      )
    })
  }, [])
  return items
}

export function useAssignments(): AssignmentCard[] {
  const [items, setItems] = useState<AssignmentCard[]>([])
  useEffect(() => {
    if (!db) return
    const q = query(classCollection('assignments'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            subject: data.subject,
            source: data.source ?? undefined,
            content: data.content,
            icon: data.icon,
            dateLabel: data.dateLabel,
            dateIso: data.dateIso ?? undefined,
            weekday: data.weekday ?? undefined,
            sourceMessageId: data.sourceMessageId ?? undefined,
          }
        }),
      )
    })
  }, [])
  return items
}

export function useAnnouncements(): AnnouncementCard[] {
  const [items, setItems] = useState<AnnouncementCard[]>([])
  useEffect(() => {
    if (!db) return
    const q = query(classCollection('announcements'), orderBy('ts', 'desc'))
    return onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            text: data.text,
            icon: data.icon,
            dateLabel: data.dateLabel,
            sourceMessageId: data.sourceMessageId ?? undefined,
          }
        }),
      )
    })
  }, [])
  return items
}

export function usePhotos(): Photo[] {
  const [items, setItems] = useState<Photo[]>([])
  useEffect(() => {
    if (!db) return
    const q = query(classCollection('photos'), orderBy('ts', 'desc'))
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
  }, [])
  return items
}

export function useRoster(): string[] {
  const [names, setNames] = useState<string[]>([])
  useEffect(() => {
    if (!db) return
    return onSnapshot(classDoc('meta', 'roster'), (snap) => {
      const data = snap.data() as DocumentData | undefined
      setNames(data?.names ?? [])
    })
  }, [])
  return names
}

// --- Writes ---

export async function sendMessageDoc(
  from: 'teacher' | 'parent',
  authorName: string,
  text: string,
  time: string,
): Promise<{ id: string }> {
  await ensureSignedIn()

  const docRef = await addDoc(classCollection('messages'), {
    from,
    authorName,
    text,
    time,
    likes: 0,
    readBy: 0,
    photoUrl: null,
    tags: [],
    ts: Date.now(),
  })

  return { id: docRef.id }
}

export async function updateMessageTags(id: string, tags: DestinationTag[]): Promise<void> {
  await ensureSignedIn()
  await updateDoc(classDoc('messages', id), { tags })
}

export async function likeMessageDoc(id: string): Promise<void> {
  await ensureSignedIn()
  await updateDoc(classDoc('messages', id), { likes: increment(1) })
}

export async function addEventDoc(meta: EventMeta, sourceMessageId: string): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection('events'), {
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

export async function addAssignmentDoc(meta: AssignmentMeta, sourceMessageId: string): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection('assignments'), {
    subject: meta.subject,
    source: meta.source ?? null,
    content: meta.content,
    icon: meta.icon,
    dateLabel: meta.dateLabel,
    dateIso: meta.dateIso ?? null,
    weekday: meta.weekday ?? null,
    sourceMessageId,
    ts: Date.now(),
  })
}

export async function addAnnouncementDoc(meta: AnnouncementMeta, sourceMessageId: string): Promise<void> {
  await ensureSignedIn()
  await addDoc(classCollection('announcements'), {
    text: meta.text,
    icon: meta.icon,
    dateLabel: meta.dateLabel,
    sourceMessageId,
    ts: Date.now(),
  })
}

// RSVP counters are shared in Firestore; *which* answer this viewer gave is
// tracked locally only (no real per-parent accounts yet to store it against).
export async function rsvpEventDoc(id: string, answer: 'yes' | 'no'): Promise<void> {
  await ensureSignedIn()
  const previous = getLocalRsvp(id)
  if (previous === answer) return

  const updates: Record<string, ReturnType<typeof increment>> = {}
  if (previous === 'yes') updates.rsvpYes = increment(-1)
  if (previous === 'no') updates.rsvpNo = increment(-1)
  updates[answer === 'yes' ? 'rsvpYes' : 'rsvpNo'] = increment(1)

  await updateDoc(classDoc('events', id), updates)
  try {
    localStorage.setItem(localRsvpKey(id), answer)
  } catch {
    // ignore - private browsing etc.
  }
}

export async function updateRosterDoc(names: string[]): Promise<void> {
  await ensureSignedIn()
  await setDoc(classDoc('meta', 'roster'), { names })
}
