import type { TabId } from '../data'

interface Tab {
  id: TabId
  label: string
  icon: string
}

const tabs: Tab[] = [
  { id: 'home', label: 'בית', icon: '🏠' },
  { id: 'calendar', label: 'יומן', icon: '📅' },
  { id: 'board', label: 'מטלות', icon: '📝' },
  { id: 'gallery', label: 'גלריה', icon: '📷' },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  badges: Partial<Record<TabId, number>>
}

export default function BottomNav({ active, onChange, badges }: Props) {
  return (
    <nav className="shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-4">
        {tabs.map((t) => {
          const isActive = active === t.id
          const badge = badges[t.id]
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                isActive ? 'text-brand-700' : 'text-slate-400'
              }`}
            >
              <span className="relative text-lg leading-none">
                {t.icon}
                {!!badge && (
                  <span className="absolute -top-1.5 -left-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </span>
              {t.label}
              {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
