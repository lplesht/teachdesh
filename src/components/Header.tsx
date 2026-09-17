import type { Role } from '../data'

interface Props {
  role: Role
  onRoleChange: (role: Role) => void
  unreadCount: number
}

export default function Header({ role, onRoleChange, unreadCount }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-lg font-bold text-white shadow-sm shadow-brand-200">
            כ
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-slate-900">כיתת ענן</p>
            <p className="text-xs leading-tight text-slate-500">בית ספר יסודי "הדקל"</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="התראות"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center rounded-full bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onRoleChange('parent')}
              className={`rounded-full px-3 py-1.5 transition ${
                role === 'parent' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              👪 תצוגת הורה
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('teacher')}
              className={`rounded-full px-3 py-1.5 transition ${
                role === 'teacher' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🍎 תצוגת מורה
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
