import { useMemo, useState } from 'react'
import { israeliHolidays, type EventCard, type HolidayEvent, type Role } from '../data'
import { HEBREW_MONTHS, WEEKDAY_SHORT, shiftDay, toISO, weekdayName } from '../dateUtils'

interface Props {
  events: EventCard[]
  role: Role
  onRsvp: (id: string, answer: 'yes' | 'no') => void
}

type ViewMode = 'week' | 'month'

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function startOfWeek(d: Date): Date {
  return shiftDay(d, -d.getDay())
}

function holidaysOn(iso: string): HolidayEvent[] {
  return israeliHolidays.filter((h) => iso >= h.startDate && iso <= (h.endDate ?? h.startDate))
}

export default function CalendarTab({ events, role, onRsvp }: Props) {
  const today = useMemo(() => new Date(), [])
  const [view, setView] = useState<ViewMode>('month')
  const [anchor, setAnchor] = useState<Date>(today)
  const [selected, setSelected] = useState<Date>(today)

  const eventsByIso = useMemo(() => {
    const map = new Map<string, EventCard[]>()
    events.forEach((e) => {
      if (!e.dateIso) return
      map.set(e.dateIso, [...(map.get(e.dateIso) ?? []), e])
    })
    return map
  }, [events])

  const undated = events.filter((e) => !e.dateIso)

  const goPrev = () => setAnchor((d) => (view === 'month' ? new Date(d.getFullYear(), d.getMonth() - 1, 1) : shiftDay(d, -7)))
  const goNext = () => setAnchor((d) => (view === 'month' ? new Date(d.getFullYear(), d.getMonth() + 1, 1) : shiftDay(d, 7)))
  const goToday = () => {
    setAnchor(today)
    setSelected(today)
  }

  const selectedIso = toISO(selected)
  const selectedHolidays = holidaysOn(selectedIso)
  const selectedEvents = eventsByIso.get(selectedIso) ?? []

  const gridDays: Date[] = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(anchor)
      return Array.from({ length: 7 }, (_, i) => shiftDay(start, i))
    }
    const gridStart = startOfWeek(startOfMonth(anchor))
    return Array.from({ length: 42 }, (_, i) => shiftDay(gridStart, i))
  }, [view, anchor])

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <span>📅</span> יומן {view === 'month' ? 'חודשי' : 'שבועי'}
        </h2>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setView('week')}
            className={`rounded-full px-2.5 py-1 transition ${view === 'week' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            שבוע
          </button>
          <button
            type="button"
            onClick={() => setView('month')}
            className={`rounded-full px-2.5 py-1 transition ${view === 'month' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
          >
            חודש
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={goPrev} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="הקודם">
          ›
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {HEBREW_MONTHS[anchor.getMonth()]} {anchor.getFullYear()}
          </span>
          <button type="button" onClick={goToday} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            היום
          </button>
        </div>
        <button type="button" onClick={goNext} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500" aria-label="הבא">
          ‹
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
        {WEEKDAY_SHORT.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((d) => {
          const iso = toISO(d)
          const inMonth = view === 'week' || d.getMonth() === anchor.getMonth()
          const isToday = iso === toISO(today)
          const isSelected = iso === selectedIso
          const dayHolidays = holidaysOn(iso)
          const isVacation = dayHolidays.some((h) => h.kind === 'vacation')
          const hasHoliday = dayHolidays.some((h) => h.kind === 'holiday')
          const hasEvent = eventsByIso.has(iso)
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setSelected(d)}
              className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs transition ${
                !inMonth ? 'text-slate-300' : isVacation ? 'bg-sun-50 text-sun-700' : 'text-slate-700'
              } ${isSelected ? 'ring-2 ring-brand-500' : ''} ${isToday ? 'font-extrabold' : ''}`}
            >
              <span>{d.getDate()}</span>
              <span className="flex h-1.5 gap-0.5">
                {hasHoliday && <span className="h-1.5 w-1.5 rounded-full bg-sun-500" />}
                {hasEvent && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
        <p className="mb-2 text-sm font-bold text-slate-800">
          {weekdayName(selected)}, {selected.getDate()}.{selected.getMonth() + 1}
        </p>

        {selectedHolidays.length === 0 && selectedEvents.length === 0 && (
          <p className="text-xs text-slate-400">אין אירועים ביום זה</p>
        )}

        {selectedHolidays.map((h) => (
          <div key={h.id} className="mb-1.5 flex items-center gap-2 text-sm text-slate-700">
            <span>{h.icon}</span>
            <span className="font-semibold">{h.title}</span>
            {h.kind === 'vacation' && (
              <span className="rounded-full bg-sun-100 px-1.5 py-0.5 text-[10px] font-bold text-sun-600">אין חינוך</span>
            )}
          </div>
        ))}

        {selectedEvents.map((ev) => (
          <div key={ev.id} className="mt-2 rounded-xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-lg">{ev.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{ev.title}</p>
                <p className="text-[11px] text-slate-400">
                  {ev.location}
                  {ev.time ? ` · ${ev.time}` : ''}
                </p>
              </div>
            </div>
            {role === 'parent' ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onRsvp(ev.id, 'yes')}
                  className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${
                    ev.myRsvp === 'yes' ? 'bg-leaf-500 text-white' : 'bg-leaf-50 text-leaf-600'
                  }`}
                >
                  ✅ מגיע/ה ({ev.rsvpYes})
                </button>
                <button
                  type="button"
                  onClick={() => onRsvp(ev.id, 'no')}
                  className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${
                    ev.myRsvp === 'no' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  ❌ לא מגיע/ה ({ev.rsvpNo})
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] text-slate-400">
                ✅ {ev.rsvpYes} מגיעים · ❌ {ev.rsvpNo} לא מגיעים
              </p>
            )}
          </div>
        ))}
      </div>

      {undated.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-sm font-extrabold text-slate-900">אירועים בלי תאריך קבוע</h3>
          <ul className="flex flex-col gap-2">
            {undated.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="text-lg">{ev.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                  <p className="text-[11px] text-slate-400">{ev.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
