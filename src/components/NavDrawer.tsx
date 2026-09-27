import type { TabId } from '../data'

interface DrawerItem {
  id: TabId
  label: string
  icon: string
}

const items: DrawerItem[] = [
  { id: 'announcements', label: 'הודעות', icon: '📌' },
  { id: 'board', label: 'מטלות', icon: '📝' },
  { id: 'calendar', label: 'יומן', icon: '📅' },
  { id: 'gallery', label: 'גלריה', icon: '📷' },
]

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (tab: TabId) => void
  badges: Partial<Record<TabId, number>>
}

export default function NavDrawer({ open, onClose, onNavigate, badges }: Props) {
  if (!open) return null

  const go = (tab: TabId) => {
    onNavigate(tab)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-20">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-900/40" aria-label="סגירת תפריט" />
      <div className="absolute right-0 top-0 h-full w-64 max-w-[80%] overflow-y-auto bg-white p-3 shadow-2xl">
        <p className="mb-2 px-2 text-xs font-bold text-slate-400">ניווט</p>

        <button
          type="button"
          onClick={() => go('home')}
          className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span className="text-lg">💬</span> צ'אט
        </button>

        <div className="my-1 border-t border-slate-100" />

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span> {item.label}
            </span>
            {!!badges[item.id] && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {badges[item.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
