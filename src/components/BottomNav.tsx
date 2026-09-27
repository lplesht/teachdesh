import type { TabId } from '../data'
import { BellIcon, CalendarIcon, ChatIcon, ClipboardIcon, ImageIcon } from './icons'

interface Tab {
  id: TabId
  label: string
  Icon: typeof ChatIcon
}

const tabs: Tab[] = [
  { id: 'home', label: "צ'אט", Icon: ChatIcon },
  { id: 'announcements', label: 'הודעות', Icon: BellIcon },
  { id: 'board', label: 'מטלות', Icon: ClipboardIcon },
  { id: 'calendar', label: 'יומן', Icon: CalendarIcon },
  { id: 'gallery', label: 'גלריה', Icon: ImageIcon },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  badges: Partial<Record<TabId, number>>
}

export default function BottomNav({ active, onChange, badges }: Props) {
  return (
    <nav className="shrink-0 border-t border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="grid grid-cols-5">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id
          const badge = badges[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <span className="relative">
                <Icon className={`h-5 w-5 transition ${isActive ? 'scale-105' : ''}`} />
                {!!badge && (
                  <span className="absolute -top-1.5 -left-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {badge}
                  </span>
                )}
              </span>
              {label}
              {isActive && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-brand-600" />}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
