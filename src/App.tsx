import { useState } from 'react'
import Header from './components/Header'
import ClassHero from './components/ClassHero'
import AnnouncementsFeed from './components/AnnouncementsFeed'
import ClassGallery from './components/ClassGallery'
import TeacherChat from './components/TeacherChat'
import EventsPanel from './components/EventsPanel'
import DutyRoster from './components/DutyRoster'
import {
  initialAnnouncements,
  initialChat,
  initialEvents,
  initialPhotos,
  type Announcement,
  type ChatMessage,
  type Photo,
  type Role,
  type SchoolEvent,
} from './data'

const photoDecks = [
  { gradient: 'from-brand-400 to-leaf-500', emoji: '🖼️' },
  { gradient: 'from-sun-300 to-brand-400', emoji: '🎭' },
  { gradient: 'from-leaf-400 to-sun-400', emoji: '🧪' },
]

export default function App() {
  const [role, setRole] = useState<Role>('parent')
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [messages, setMessages] = useState<ChatMessage[]>(initialChat)
  const [events, setEvents] = useState<SchoolEvent[]>(initialEvents)

  const addAnnouncement = (title: string, body: string) => {
    setAnnouncements((prev) => [
      { id: `a${Date.now()}`, title, body, time: 'עכשיו', tag: 'הודעה', pinned: false },
      ...prev,
    ])
  }

  const addPhoto = () => {
    const deck = photoDecks[photos.length % photoDecks.length]
    setPhotos((prev) => [
      { id: `p${Date.now()}`, caption: 'תמונה חדשה מהכיתה', date: 'היום', gradient: deck.gradient, emoji: deck.emoji },
      ...prev,
    ])
  }

  const sendMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `c${Date.now()}`,
        from: 'teacher',
        authorName: 'תהילה שם טוב',
        text,
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        readBy: 0,
      },
    ])
  }

  const likeMessage = (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)))
  }

  const rsvpEvent = (id: string, answer: 'yes' | 'no') => {
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== id) return ev
        if (ev.myRsvp === answer) return ev
        let { rsvpYes, rsvpNo } = ev
        if (ev.myRsvp === 'yes') rsvpYes -= 1
        if (ev.myRsvp === 'no') rsvpNo -= 1
        if (answer === 'yes') rsvpYes += 1
        if (answer === 'no') rsvpNo += 1
        return { ...ev, myRsvp: answer, rsvpYes, rsvpNo }
      }),
    )
  }

  const createEvent = (title: string, date: string, time: string, location: string) => {
    setEvents((prev) => [
      { id: `e${Date.now()}`, title, date, time, location, icon: '🎉', rsvpYes: 0, rsvpNo: 0, myRsvp: null },
      ...prev,
    ])
  }

  return (
    <div className="min-h-screen pb-16">
      <Header role={role} onRoleChange={setRole} unreadCount={announcements.length} />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
        <ClassHero />

        {role === 'teacher' && (
          <div className="flex items-center gap-2 rounded-2xl bg-sun-50 px-4 py-3 text-xs font-semibold text-sun-600 ring-1 ring-sun-200">
            🍎 את צופה כעת במסך בתצוגת מורה — כל מה שתפרסמי כאן יישלח מיידית לכל הורי הכיתה.
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <AnnouncementsFeed announcements={announcements} role={role} onAdd={addAnnouncement} />
            <TeacherChat messages={messages} role={role} onSend={sendMessage} onLike={likeMessage} />
          </div>

          <div className="flex flex-col gap-5">
            <ClassGallery photos={photos} role={role} onAdd={addPhoto} />
            <EventsPanel events={events} role={role} onRsvp={rsvpEvent} onCreate={createEvent} />
            <DutyRoster />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-6 text-center text-xs text-slate-400">
        כיתת ענן · דמו לאפליקציית קשר הורה-מורה · לא לשימוש בפועל
      </footer>
    </div>
  )
}
