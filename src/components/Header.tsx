import type { ClassInfo } from '../classes'
import type { Role } from '../data'
import { KeyIcon, MenuIcon, RosterIcon } from './icons'

interface Props {
  classInfo: ClassInfo
  role: Role
  isAdmin: boolean
  displayName: string
  studentsCount: number
  onOpenRoster: () => void
  onOpenAccessManager: () => void
  onOpenDrawer: () => void
}

export default function Header({
  classInfo,
  role,
  isAdmin,
  displayName,
  studentsCount,
  onOpenRoster,
  onOpenAccessManager,
  onOpenDrawer,
}: Props) {
  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white/95 px-4 pb-2.5 pt-3 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="הכיתות שלי"
          >
            <MenuIcon className="h-[18px] w-[18px]" />
          </button>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm shadow-brand-300/50">
            {classInfo.teacherInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              כיתה {classInfo.className} · {classInfo.teacherName}
            </p>
            <p className="truncate text-[11px] leading-tight text-slate-500">{classInfo.schoolName}</p>
          </div>
        </div>

        {(isAdmin || role === 'teacher') && (
          <div className="flex shrink-0 items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAccessManager}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="ניהול משתמשים"
              >
                <KeyIcon className="h-[18px] w-[18px]" />
              </button>
            )}
            {role === 'teacher' && (
              <button
                type="button"
                onClick={onOpenRoster}
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="עדכון דף קשר"
              >
                <RosterIcon className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          {studentsCount} תלמידים · לפי דף הקשר
        </span>

        <div className="flex items-center gap-2">
          <span className="truncate text-[11px] font-semibold text-slate-500">
            {displayName} · {role === 'teacher' ? 'מורה' : 'הורה'}
          </span>
        </div>
      </div>
    </header>
  )
}
