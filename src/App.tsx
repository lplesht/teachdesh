import { useRef, useState } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import ChatScreen from './components/ChatScreen'
import CalendarTab from './components/CalendarTab'
import BoardTab from './components/BoardTab'
import AnnouncementsTab from './components/AnnouncementsTab'
import GalleryTab from './components/GalleryTab'
import RosterModal from './components/RosterModal'
import { classifyMessage, destinationLabel } from './classify'
import { classifyWithLLM } from './llmClassify'
import { firebaseReady } from './firebase'
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

const TEACHER_NAME = 'תהילה שם טוב'

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

export default function App() {
  const [role, setRole] = useState<Role>('parent')
  const [tab, setTab] = useState<TabId>('home')
  const [rosterOpen, setRosterOpen] = useState(false)

  const students = useRoster()
  const messages = useMessages()
  const events = useEvents()
  const assignments = useAssignments()
  const announcements = useAnnouncements()
  const photos = usePhotos()

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
      const { id } = await sendMessageDoc('teacher', TEACHER_NAME, text, time)

      const llmOutcome = await classifyWithLLM(text, false, sentAt)
      const result = llmOutcome.result ?? classifyMessage(text, false, sentAt)

      await updateMessageTags(id, result.tags)
      await Promise.all([
        ...result.events.map((e) => addEventDoc(e, id)),
        ...result.assignments.map((a) => addAssignmentDoc(a, id, sentAt)),
        ...result.announcements.map((a) => addAnnouncementDoc(a, id)),
      ])

      const engineLabel =
        result.engine === 'gemini' ? '🤖 Gemini' : `📋 חוקים (Gemini נכשל: ${llmOutcome.failReason ?? 'לא ידוע'})`
      showToast(`${engineLabel} · נוסף אוטומטית ל: ${result.tags.map((t) => destinationLabel[t]).join(' + ')}`)
    })()
  }

  const likeMessage = (id: string) => {
    void likeMessageDoc(id)
  }

  const deleteMessage = (id: string) => {
    if (!window.confirm('למחוק את ההודעה? היא תוסר גם מכל הלוחות שאליהם נותבה (מטלות/יומן/הודעות/גלריה).')) return
    void deleteMessageDoc(id)
  }

  const rsvpEvent = (id: string, answer: 'yes' | 'no') => {
    void rsvpEventDoc(id, answer)
  }

  if (!firebaseReady) return <FirebaseSetupNotice />

  return (
    <div className="min-h-dvh bg-slate-200 sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f4f6fb] sm:h-[860px] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-slate-900/90">
        <Header role={role} onRoleChange={setRole} studentsCount={students.length} onOpenRoster={() => setRosterOpen(true)} />

        <main className="min-h-0 flex-1">
          {tab === 'home' && (
            <ChatScreen
              messages={messages}
              role={role}
              routingToast={routingToast}
              onSend={sendMessage}
              onLike={likeMessage}
              onDelete={deleteMessage}
              onNavigate={setTab}
            />
          )}
          {tab === 'calendar' && <CalendarTab events={events} role={role} onRsvp={rsvpEvent} />}
          {tab === 'board' && <BoardTab assignments={assignments} />}
          {tab === 'announcements' && <AnnouncementsTab announcements={announcements} />}
          {tab === 'gallery' && <GalleryTab photos={photos} />}
        </main>

        <BottomNav
          active={tab}
          onChange={setTab}
          badges={{
            calendar: events.length || undefined,
            board: assignments.length || undefined,
            announcements: announcements.length || undefined,
          }}
        />
      </div>

      {rosterOpen && (
        <RosterModal students={students} onClose={() => setRosterOpen(false)} onUpdate={(names) => void updateRosterDoc(names)} />
      )}
    </div>
  )
}
