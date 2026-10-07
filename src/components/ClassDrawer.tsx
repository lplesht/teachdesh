import { CLASSES } from '../classes'
import type { Membership } from '../auth/session'
import { getChatSeen } from '../chatSeen'
import { useMessages } from '../firestoreData'

interface Props {
  open: boolean
  memberships: Membership[]
  activeClassId: string
  onClose: () => void
  onSwitch: (classId: string) => void
  displayName: string
  onLogout: () => void
}

// Each row watches its own class's messages so the unread count stays live
// even for classes that aren't the open one. Only classes this device has
// opened before can show a count - there's no "last seen" to compare with
// for one it has never looked at.
function ClassRow({
  classId,
  active,
  onSwitch,
}: {
  classId: string
  active: boolean
  onSwitch: () => void
}) {
  const info = CLASSES[classId]
  const messages = useMessages(classId)
  const seen = getChatSeen(classId)
  const unread = !active && seen !== null ? messages.filter((m) => m.ts > seen).length : 0

  return (
    <li className={`rounded-2xl border p-3 ${active ? 'border-brand-300 bg-brand-50' : 'border-slate-100 bg-white'}`}>
      <button type="button" onClick={onSwitch} className="flex w-full items-center gap-3 text-start">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
          {info?.teacherInitials ?? '?'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-slate-900">כיתה {info?.className ?? classId}</span>
          <span className="block truncate text-[11px] text-slate-500">
            {info ? `${info.teacherName} · ${info.schoolName}` : ''}
          </span>
        </span>
        {unread > 0 && (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
        {active && <span className="shrink-0 text-[10px] font-bold text-brand-600">פעילה</span>}
      </button>
    </li>
  )
}

export default function ClassDrawer({
  open,
  memberships,
  activeClassId,
  onClose,
  onSwitch,
  displayName,
  onLogout,
}: Props) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-40 flex" dir="rtl">
      <aside className="flex h-full w-[82%] max-w-xs flex-col bg-white p-4 shadow-2xl">
        <h2 className="mb-1 text-base font-extrabold text-slate-900">הכיתות שלי</h2>
        <p className="mb-3 text-xs text-slate-500">
          {memberships.length > 1 ? 'בחרו כיתה כדי לעבור אליה.' : 'הכיתה שמשויכת אליך.'}
        </p>

        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {memberships.map((m) => (
            <ClassRow
              key={m.classId}
              classId={m.classId}
              active={m.classId === activeClassId}
              onSwitch={() => onSwitch(m.classId)}
            />
          ))}
        </ul>

        <p className="mt-3 truncate text-center text-xs font-semibold text-slate-500">{displayName}</p>
        <button type="button" onClick={onLogout} className="mt-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-rose-600">
          התנתקות
        </button>
      </aside>
      <button type="button" aria-label="סגירה" onClick={onClose} className="h-full flex-1 bg-slate-900/50" />
    </div>
  )
}
