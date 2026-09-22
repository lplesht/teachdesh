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
import {
  initialAnnouncements,
  initialAssignments,
  initialEvents,
  initialMessages,
  initialPhotos,
  initialStudents,
  type AnnouncementCard,
  type AssignmentCard,
  type ChatMessage,
  type EventCard,
  type Photo,
  type Role,
  type TabId,
} from './data'

export default function App() {
  const [role, setRole] = useState<Role>('parent')
  const [tab, setTab] = useState<TabId>('home')
  const [students, setStudents] = useState<string[]>(initialStudents)
  const [rosterOpen, setRosterOpen] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [events, setEvents] = useState<EventCard[]>(initialEvents)
  const [assignments, setAssignments] = useState<AssignmentCard[]>(initialAssignments)
  const [announcements, setAnnouncements] = useState<AnnouncementCard[]>(initialAnnouncements)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)

  const [routingToast, setRoutingToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setRoutingToast(text)
    toastTimer.current = setTimeout(() => setRoutingToast(null), 3800)
  }

  const sendMessage = (text: string, photoDataUrl?: string) => {
    const id = `c${Date.now()}`
    const time = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const { tags, eventMeta, assignmentMeta, announcementMeta } = classifyMessage(text, !!photoDataUrl)

    setMessages((prev) => [
      ...prev,
      { id, from: 'teacher', authorName: 'תהילה שם טוב', text, time, likes: 0, readBy: 0, photoUrl: photoDataUrl, tags },
    ])

    if (eventMeta) {
      setEvents((prev) => [
        {
          id: `e${Date.now()}`,
          title: eventMeta.title,
          date: eventMeta.date,
          dateIso: eventMeta.dateIso,
          time: eventMeta.time,
          location: eventMeta.location,
          icon: eventMeta.icon,
          rsvpYes: 0,
          rsvpNo: 0,
          myRsvp: null,
          sourceMessageId: id,
        },
        ...prev,
      ])
    }

    if (assignmentMeta) {
      setAssignments((prev) => [
        {
          id: `a${Date.now()}`,
          subject: assignmentMeta.subject,
          text: assignmentMeta.text,
          icon: assignmentMeta.icon,
          dateLabel: assignmentMeta.dateLabel,
          dateIso: assignmentMeta.dateIso,
          weekday: assignmentMeta.weekday,
          sourceMessageId: id,
        },
        ...prev,
      ])
    }

    if (announcementMeta) {
      setAnnouncements((prev) => [
        { id: `n${Date.now()}`, text: announcementMeta.text, icon: announcementMeta.icon, dateLabel: announcementMeta.dateLabel, sourceMessageId: id },
        ...prev,
      ])
    }

    if (photoDataUrl) {
      setPhotos((prev) => [
        { id: `p${Date.now()}`, caption: text || 'תמונה מהכיתה', date: 'היום', gradient: '', emoji: '', imageUrl: photoDataUrl, sourceMessageId: id },
        ...prev,
      ])
    }

    showToast(`🤖 ההודעה סווגה אוטומטית ונוספה ל: ${tags.map((t) => destinationLabel[t]).join(' + ')}`)
  }

  const likeMessage = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)))
  }

  const rsvpEvent = (id: string, answer: 'yes' | 'no') => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id || ev.myRsvp === answer) return ev
        let { rsvpYes, rsvpNo } = ev
        if (ev.myRsvp === 'yes') rsvpYes -= 1
        if (ev.myRsvp === 'no') rsvpNo -= 1
        if (answer === 'yes') rsvpYes += 1
        if (answer === 'no') rsvpNo += 1
        return { ...ev, myRsvp: answer, rsvpYes, rsvpNo }
      }),
    )
  }

  return (
    <div className="min-h-dvh bg-slate-200 sm:flex sm:items-center sm:justify-center sm:p-8">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#f4f6fb] sm:h-[860px] sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-8 sm:ring-slate-900/90">
        <Header role={role} onRoleChange={setRole} studentsCount={students.length} onOpenRoster={() => setRosterOpen(true)} />

        <main className="min-h-0 flex-1">
          {tab === 'home' && (
            <ChatScreen messages={messages} role={role} routingToast={routingToast} onSend={sendMessage} onLike={likeMessage} onNavigate={setTab} />
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

      {rosterOpen && <RosterModal students={students} onClose={() => setRosterOpen(false)} onUpdate={setStudents} />}
    </div>
  )
}
