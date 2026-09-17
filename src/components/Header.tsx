import { classInfo, type Role } from '../data'

interface Props {
  role: Role
  onRoleChange: (role: Role) => void
  studentsCount: number
  onOpenRoster: () => void
}

export default function Header({ role, onRoleChange, studentsCount, onOpenRoster }: Props) {
  return (
    <header className="shrink-0 border-b border-slate-200 bg-white/90 px-4 pb-2.5 pt-3 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-sm shadow-brand-200">
            {classInfo.teacherInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-900">
              כיתה {classInfo.className} · {classInfo.teacherName}
            </p>
            <p className="truncate text-[11px] leading-tight text-slate-500">{classInfo.schoolName}</p>
          </div>
        </div>

        {role === 'teacher' && (
          <button
            type="button"
            onClick={onOpenRoster}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-base text-slate-600 transition hover:bg-slate-200"
            aria-label="עדכון דף קשר"
          >
            🧾
          </button>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          🧒 {studentsCount} תלמידים · לפי דף הקשר
        </span>

        <div className="flex items-center rounded-full bg-slate-100 p-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onRoleChange('parent')}
            className={`rounded-full px-2.5 py-1 transition ${
              role === 'parent' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            👪 הורה
          </button>
          <button
            type="button"
            onClick={() => onRoleChange('teacher')}
            className={`rounded-full px-2.5 py-1 transition ${
              role === 'teacher' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            🍎 מורה
          </button>
        </div>
      </div>
    </header>
  )
}
