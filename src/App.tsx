import { useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import ChatScreen from './components/ChatScreen'
import CalendarTab from './components/CalendarTab'
import BoardTab from './components/BoardTab'
import AnnouncementsTab from './components/AnnouncementsTab'
import GalleryTab from './components/GalleryTab'
import RosterModal from './components/RosterModal'
import LoginScreen from './components/LoginScreen'
import UserManagerModal, { UserManager } from './components/UserManagerModal'
import InstallPrompt from './components/InstallPrompt'
import PushPrompt from './components/PushPrompt'
import { classifyMessage, destinationLabel } from './classify'
import { classifyWithLLM } from './llmClassify'
import { firebaseReady } from './firebase'
import { logout, membershipsOf, useActiveMembership, useMyUser, useSession, type Membership } from './auth/session'
import ClassDrawer from './components/ClassDrawer'
import { setChatSeen } from './chatSeen'
import { CLASSES } from './classes'
import { usePresenceHeartbeat } from './presence'
import { onForegroundPush } from './push'
import {
  addAnnouncementDoc,
  addAssignmentDoc,
  addEventDoc,
  deleteMessageDoc,
  rsvpEventDoc,
  sendMessageDoc,
  toggleLikeMessageDoc,
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

function getSeenTs(classId: string, tab: BadgedTab): number {
  try {
    return Number(localStorage.getItem(`teachdesh_seen_${classId}_${tab}`)) || 0
  } catch {
    return 0
  }
}

function setSeenTs(classId: string, tab: BadgedTab, ts: number): void {
  try {
    localStorage.setItem(`teachdesh_seen_${classId}_${tab}`, String(ts))
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

function LogoutButton() {
  return (
    <button type="button" onClick={() => void logout()} className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-rose-600">
      התנתקות
    </button>
  )
}

// Logged in, but not (yet) assigned to any class. The admin lands on the user
// manager - it's the only thing they need to do their job - and anyone else is
// told to ask the admin.
function NoClassScreen({ displayName, isAdmin }: { displayName: string; isAdmin: boolean }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 p-6" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        {isAdmin ? (
          <UserManager />
        ) : (
          <>
            <h1 className="mb-1 text-lg font-extrabold text-slate-900">שלום {displayName}</h1>
            <p className="text-sm text-slate-500">עדיין לא שויכת לאף כיתה. יש לפנות למנהל המערכת כדי שישייך אותך.</p>
          </>
        )}
        <LogoutButton />
      </div>
    </div>
  )
}

export default function App() {
  const session = useSession()
  const me = useMyUser(session)
  const memberships = useMemo(() => (me && me !== 'loading' ? membershipsOf(me) : []), [me])
  const [active, setActive] = useActiveMembership(memberships)

  // A session can outlive its user: the admin may have deleted them or changed
  // their code (the rules then refuse the read). Drop the stale session so
  // they land on the login screen instead of an app that no longer loads.
  useEffect(() => {
    if (session !== 'loading' && session !== null && me === null) void logout()
  }, [session, me])

  if (!firebaseReady) return <FirebaseSetupNotice />
  if (session === 'loading' || me === 'loading') return <LoadingScreen />
  if (session === null || me === null) return <LoginScreen />
  if (active === null) return <NoClassScreen displayName={me.displayName} isAdmin={me.admin} />

  return (
    <SignedInApp
      key={active.classId}
      classId={active.classId}
      phone={me.phone}
      role={active.role}
      isAdmin={me.admin}
      displayName={me.displayName}
      memberships={memberships}
      onSwitchClass={setActive}
    />
  )
}

function SignedInApp({
  classId,
  phone,
  role,
  isAdmin,
  displayName,
  memberships,
  onSwitchClass,
}: {
  classId: string
  phone: string
  role: Role
  isAdmin: boolean
  displayName: string
  memberships: Membership[]
  onSwitchClass: (classId: string) => void
}) {
  const [tab, setTab] = useState<TabId>('home')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [accessManagerOpen, setAccessManagerOpen] = useState(false)
  const [scrollToMessageId, setScrollToMessageId] = useState<string | null>(null)
  const [highlightSourceId, setHighlightSourceId] = useState<string | null>(null)

  usePresenceHeartbeat(classId, phone, displayName)

  const students = useRoster(classId)
  const messages = useMessages(classId)
  const events = useEvents(classId)
  const assignments = useAssignments(classId)
  const announcements = useAnnouncements(classId)
  const photos = usePhotos(classId)

  // The class drawer counts messages newer than this as unread while this
  // class isn't the open one.
  useEffect(() => {
    if (tab === 'home') setChatSeen(classId, Date.now())
  }, [classId, tab, messages])

  const classInfo = CLASSES[classId]

  const [seenTs, setSeenTsState] = useState<Record<BadgedTab, number>>(() => ({
    calendar: getSeenTs(classId, 'calendar'),
    board: getSeenTs(classId, 'board'),
    announcements: getSeenTs(classId, 'announcements'),
  }))

  // The "seen" line each tab's items are compared against while that tab is
  // open, so items newer than the *previous* visit stay highlighted as
  // unread for this whole viewing session - rather than clearing the moment
  // seenTs itself is bumped to now below.
  const [unreadSince, setUnreadSince] = useState<Record<BadgedTab, number>>(() => ({
    calendar: getSeenTs(classId, 'calendar'),
    board: getSeenTs(classId, 'board'),
    announcements: getSeenTs(classId, 'announcements'),
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
    setSeenTs(classId, t, now)
    setSeenTsState((prev) => ({ ...prev, [t]: now }))
  }, [tab, events, assignments, announcements])

  const [routingToast, setRoutingToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setRoutingToast(text)
    toastTimer.current = setTimeout(() => setRoutingToast(null), 3800)
  }

  // Only fires while this tab is open and in the foreground - backgrounded
  // or closed is handled by the service worker itself (src/sw.js).
  useEffect(() => {
    let unsub: (() => void) | undefined
    void onForegroundPush((title, body) => showToast(`🔔 ${title}: ${body}`)).then((fn) => {
      unsub = fn
    })
    return () => unsub?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = (text: string) => {
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const sentAt = new Date()

    void (async () => {
      const { id } = await sendMessageDoc(classId, 'teacher', phone, displayName, text, time)

      const llmOutcome = await classifyWithLLM(text, false, sentAt)
      const result = llmOutcome.result ?? classifyMessage(text, false, sentAt)

      await updateMessageTags(classId, id, result.tags)
      await Promise.all([
        ...result.events.map((e) => addEventDoc(classId, e, id)),
        ...result.assignments.map((a) => addAssignmentDoc(classId, a, id, sentAt)),
        ...result.announcements.map((a) => addAnnouncementDoc(classId, a, id, sentAt)),
      ])

      const routedNowhere = result.tags.length === 1 && result.tags[0] === 'general'
      // Gemini legitimately finding nothing to route is a normal outcome,
      // not a failure worth blaming on Gemini - only genuine errors
      // (network, bad key, timeout, etc.) should be reported as such.
      if (routedNowhere) {
        showToast('לא נמצא סיווג מתאים, נשאר בצ׳אט')
      } else if (result.engine === 'gemini') {
        showToast(`🤖 Gemini · נוסף אוטומטית ל: ${result.tags.map((t) => destinationLabel[t]).join(' + ')}`)
      } else if (llmOutcome.failReason === 'לא הוחזר תוכן שמיש') {
        showToast(`📋 חוקים · נוסף אוטומטית ל: ${result.tags.map((t) => destinationLabel[t]).join(' + ')}`)
      } else {
        showToast(
          `📋 חוקים (Gemini נכשל: ${llmOutcome.failReason ?? 'לא ידוע'}) · נוסף אוטומטית ל: ${result.tags
            .map((t) => destinationLabel[t])
            .join(' + ')}`,
        )
      }
    })()
  }

  const likeMessage = (id: string) => {
    const msg = messages.find((m) => m.id === id)
    const currentlyLiked = !!msg?.likedBy[phone]
    void toggleLikeMessageDoc(classId, id, phone, displayName, currentlyLiked)
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
          isAdmin={isAdmin}
          displayName={displayName}
          studentsCount={students.length}
          onOpenRoster={() => setRosterOpen(true)}
          onOpenAccessManager={() => setAccessManagerOpen(true)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <InstallPrompt />
        <PushPrompt classId={classId} phone={phone} displayName={displayName} />

        <main className="min-h-0 flex-1">
          {tab === 'home' && (
            <ChatScreen
              messages={messages}
              role={role}
              myPhone={phone}
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

        <ClassDrawer
          open={drawerOpen}
          memberships={memberships}
          activeClassId={classId}
          onClose={() => setDrawerOpen(false)}
          onSwitch={(id) => {
            setDrawerOpen(false)
            if (id !== classId) onSwitchClass(id)
          }}
          displayName={displayName}
          onLogout={() => void logout()}
        />
      </div>

      {rosterOpen && (
        <RosterModal
          students={students}
          onClose={() => setRosterOpen(false)}
          onUpdate={(names) => void updateRosterDoc(classId, names)}
        />
      )}
      {accessManagerOpen && <UserManagerModal onClose={() => setAccessManagerOpen(false)} />}
    </div>
  )
}
