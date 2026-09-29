import { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import ChatScreen from './components/ChatScreen'
import CalendarTab from './components/CalendarTab'
import BoardTab from './components/BoardTab'
import AnnouncementsTab from './components/AnnouncementsTab'
import GalleryTab from './components/GalleryTab'
import RosterModal from './components/RosterModal'
import LoginScreen from './components/LoginScreen'
import AccessManagerModal from './components/AccessManagerModal'
import InstallPrompt from './components/InstallPrompt'
import { classifyMessage, destinationLabel } from './classify'
import { classifyWithLLM } from './llmClassify'
import { firebaseReady } from './firebase'
import { useMyAccess, useSession, logout } from './auth/session'
import { CLASSES } from './classes'
import {
  addAnnouncementDoc,
  addAssignmentDoc,
  addEventDoc,
  deleteMessageDoc,
  likeMessageDoc,
  rsvpEventDoc,
  sendMessageDoc,
  updateMessageTags,
  updateRosterDoc,
  useAnnouncements,
  useAssignments,
  useEvents,
  useMessages,
  usePhotos,
  useRoster,
} from './firestoreData'
import type { Role, TabId } from './data'

// Which tabs show an unread-count badge, and how many of their items are
// newer than the last time this viewer (per browser, via localStorage - no
// per-parent read receipts yet) actually opened that tab.
type BadgedTab = 'calendar' | 'board' | 'announcements'
const BADGED_TABS: BadgedTab[] = ['calendar', 'board', 'announcements']

function getSeenTs(tab: BadgedTab): number {
  try {
    return Number(localStorage.getItem(`teachdesh_seen_${tab}`)) || 0
  } catch {
    return 0
  }
}

function setSeenTs(tab: BadgedTab, ts: number): void {
  try {
    localStorage.setItem(`teachdesh_seen_${tab}`, String(ts))
  } catch {
    // ignore - private browsing etc.
  }
}

function FirebaseSetupNotice() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6 text-center" dir="rtl">
      <div className="max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-lg font-extrabold text-slate-900">חסרה הגדרת Firebase</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          האפליקציה לא מחוברת עדיין למסד נתונים. צריך להוסיף את משתני הסביבה <code dir="ltr">VITE_FIREBASE_*</code> כ-secrets
          בריפו (ראה הוראות בצ'אט).
        </p>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100" dir="rtl">
      <p className="text-sm font-semibold text-slate-400">טוען...</p>
    </div>
  )
}

export default function App() {
  const session = useSession()
  const access = useMyAccess(session)

  // A session can outlive its access doc (e.g. a teacher removed that
  // entry) - the sessions/{uid} write rule only allows *create*, so a
  // lingering session would otherwise permanently block re-login. Clear it
  // automatically so the person just sees the login screen again.
  useEffect(() => {
    if (session !== 'loading' && session !== null && access === null) void logout()
  }, [session, access])

  if (!firebaseReady) return <FirebaseSetupNotice />
  if (session === 'loading' || access === 'loading') return <LoadingScreen />
  if (session === null || access === null) return <LoginScreen />

  return <SignedInApp classId={session.classId} role={access.role} displayName={access.displayName} />
}

function SignedInApp({ classId, role, displayName }: { classId: string; role: Role; displayName: string }) {
  const [tab, setTab] = useState<TabId>('home')
  const [rosterOpen, setRosterOpen] = useState(false)
  const [accessManagerOpen, setAccessManagerOpen] = useState(false)
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null)
  const [highlightSourceId, setHighlightSourceId] = useState<string | null>(null)

  const students = useRoster(classId)
  const messages = useMessages(classId)
  const events = useEvents(classId)
  const assignments = useAssignments(classId)
  const announcements = useAnnouncements(classId)
  const photos = usePhotos(classId)

  const classInfo = CLASSES[classId]

  const [seenTs, setSeenTsState] = useState<Record<BadgedTab, number>>(() => ({
    calendar: getSeenTs('calendar'),
    board: getSeenTs('board'),
    announcements: getSeenTs('announcements'),
  }))

  // The "seen" line each tab's items are compared against while that tab is
  // open, so items newer than the *previous* visit stay highlighted as
  // unread for this whole viewing session - rather than clearing the moment
  // seenTs itself is bumped to now below.
  const [unreadSince, setUnreadSince] = useState<Record<BadgedTab, number>>(() => ({
    calendar: getSeenTs('calendar'),
    board: getSeenTs('board'),
    announcements: getSeenTs('announcements'),
  }))

  // Freezes this tab's unread-since line at its last-seen value the moment
  // you switch into it (before the effect below moves that value forward),
  // so items that arrived since your last visit are highlighted for this visit.
  useEffect(() => {
    if (!BADGED_TABS.includes(tab as BadgedTab)) return
    const t = tab as BadgedTab
    setUnreadSince((prev) => ({ ...prev, [t]: seenTs[t] }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Marks the active badged tab as seen-through-now - runs on every tab
  // switch, and again if its data changes while already open, so new
  // items that arrive while you're looking at the tab don't leave a stale
  // badge behind next time you come back.
  useEffect(() => {
    if (!BADGED_TABS.includes(tab as BadgedTab)) return
    const t = tab as BadgedTab
    const now = Date.now()
    setSeenTs(t, now)
    setSeenTsState((prev) => ({ ...prev, [t]: now }))
  }, [tab, events, assignments, announcements])

  const [routingToast, setRoutingToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setRoutingToast(text)
    toastTimer.current = setTimeout(() => setRoutingToast(null), 3800)
  }

  const sendMessage = (text: string) => {
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const sentAt = new Date()

    void (async () => {
      const { id } = await sendMessageDoc(classId, 'teacher', displayName, text, time)

      const llmOutcome = await classifyWithLLM(text, false, sentAt)
      const result = llmOutcome.result ?? classifyMessage(text, false, sentAt)

      await updateMessageTags(classId, id, result.tags)
      await Promise.all([
        ...result.events.map((e) => addEventDoc(classId, e, id)),
        ...result.assignments.map((a) => addAssignmentDoc(classId, a, id, sentAt)),
        ...result.announcements.map((a) => addAnnouncementDoc(classId, a, id, sentAt)),
      ])

      const engineLabel =
        result.engine === 'gemini' ? '🤖 Gemini' : `📋 חוקים (Gemini נכשל: ${llmOutcome.failReason ?? 'לא ידוע'})`
      showToast(`${engineLabel} · נוסף אוטומטית ל: ${result.tags.map((t) => destinationLabel[t]).join(' + ')}`)
    })()
  }

  const likeMessage = (id: string) => {
    void likeMessageDoc(classId, id)
  }

  const deleteMessage = (id: string) => {
    if (!window.confirm('למחוק את ההודעה? היא תוסר גם מכל הלוחות שאליהם נותבה (מטלות/יומן/הודעות/גלריה).')) return
    void deleteMessageDoc(classId, id)
  }

  const rsvpEvent = (id: string, answer: 'yes' | 'no') => {
    void rsvpEventDoc(classId, id, answer)
  }

  // Jumps back to the chat message a routed card came from - clicking an
  // assignment or announcement takes the parent straight to what the
  // teacher actually wrote, instead of just the derived summary.
  const openSourceMessage = (id?: string) => {
    if (!id) return
    setScrollToMessageId(id)
    setTab('home')
  }

  // The reverse direction - clicking a routing tag under a teacher's
  // message jumps to that tab and highlights the card(s) it produced there.
  const navigateFromTag = (destination: TabId, sourceMessageId: string) => {
    setHighlightSourceId(sourceMessageId)
    setTab(destination)
  }

  return (
    <div className="min-h-dvh bg-slate-200 sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f4f6fb] sm:h-[860px] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-slate-900/90">
        <Header
          classInfo={classInfo}
          role={role}
          displayName={displayName}
          studentsCount={students.length}
          onOpenRoster={() => setRosterOpen(true)}
          onOpenAccessManager={() => setAccessManagerOpen(true)}
          onLogout={() => void logout()}
        />

        <InstallPrompt />

        <main className="min-h-0 flex-1">
          {tab === 'home' && (
            <ChatScreen
              messages={messages}
              role={role}
              routingToast={routingToast}
              onSend={sendMessage}
              onLike={likeMessage}
              onDelete={deleteMessage}
              onNavigate={navigateFromTag}
              scrollToMessageId={scrollToMessageId}
              onScrolledToMessage={() => setScrollToMessageId(null)}
            />
          )}
          {tab === 'calendar' && <CalendarTab events={events} role={role} onRsvp={rsvpEvent} />}
          {tab === 'board' && (
            <BoardTab
              assignments={assignments}
              unreadSince={unreadSince.board}
              onOpenSource={openSourceMessage}
              highlightSourceId={highlightSourceId}
              onHighlighted={() => setHighlightSourceId(null)}
            />
          )}
          {tab === 'announcements' && (
            <AnnouncementsTab
              announcements={announcements}
              unreadSince={unreadSince.announcements}
              onOpenSource={openSourceMessage}
              highlightSourceId={highlightSourceId}
              onHighlighted={() => setHighlightSourceId(null)}
            />
          )}
          {tab === 'gallery' && (
            <GalleryTab
              photos={photos}
              highlightSourceId={highlightSourceId}
              onHighlighted={() => setHighlightSourceId(null)}
            />
          )}
        </main>

        <BottomNav
          active={tab}
          onChange={setTab}
          badges={{
            calendar: events.filter((e) => e.ts > seenTs.calendar).length || undefined,
            board: assignments.filter((a) => a.ts > seenTs.board).length || undefined,
            announcements: announcements.filter((a) => a.ts > seenTs.announcements).length || undefined,
          }}
        />
      </div>

      {rosterOpen && (
        <RosterModal
          students={students}
          onClose={() => setRosterOpen(false)}
          onUpdate={(names) => void updateRosterDoc(classId, names)}
        />
      )}
      {accessManagerOpen && <AccessManagerModal classId={classId} onClose={() => setAccessManagerOpen(false)} />}
    </div>
  )
}
