import { useState } from 'react'
import { useAccessList, setAccessDoc, deleteAccessDoc, type AccessEntry } from '../firestoreData'
import { normalizePhone } from '../auth/session'
import { formatRelativeLastSeen, isOnline, usePresenceList } from '../presence'
import { PencilIcon, TrashIcon } from './icons'

interface Props {
  classId: string
  onClose: () => void
}

function randomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export default function AccessManagerModal({ classId, onClose }: Props) {
  const entries = useAccessList(classId)
  const presence = usePresenceList(classId)
  const [phone, setPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'parent' | 'teacher'>('parent')
  const [code, setCode] = useState(randomCode())
  const [saving, setSaving] = useState(false)
  const [editingPhone, setEditingPhone] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const add = async () => {
    const normalized = normalizePhone(phone)
    if (!normalized || !displayName.trim() || !code.trim()) return
    setSaving(true)
    await setAccessDoc(classId, { phone: normalized, displayName: displayName.trim(), role, code: code.trim() })
    setSaving(false)
    setPhone('')
    setDisplayName('')
    setRole('parent')
    setCode(randomCode())
  }

  const remove = (entry: AccessEntry) => {
    if (!window.confirm(`להסיר את ${entry.displayName}?`)) return
    void deleteAccessDoc(classId, entry.phone)
  }

  const startEdit = (entry: AccessEntry) => {
    setEditingPhone(entry.phone)
    setEditName(entry.displayName)
  }

  const cancelEdit = () => {
    setEditingPhone(null)
    setEditName('')
  }

  const saveEdit = async (entry: AccessEntry) => {
    const name = editName.trim()
    if (!name) return
    setSavingEdit(true)
    await setAccessDoc(classId, { ...entry, displayName: name })
    setSavingEdit(false)
    cancelEdit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-base font-extrabold text-slate-900">ניהול הרשאות כיתה</h2>
        <p className="mb-4 text-xs text-slate-500">כל שורה כאן היא מספר טלפון + קוד שמאפשרים כניסה לאפליקציה - חלקו אותם ידנית להורה/מורה.</p>

        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-100 p-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="שם (למשל: אמא של דניאל)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="מספר טלפון"
            type="tel"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <div className="flex items-center gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="קוד"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <div className="flex items-center rounded-full bg-slate-100 p-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setRole('parent')}
                className={`rounded-full px-2.5 py-1 transition ${role === 'parent' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
              >
                הורה
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`rounded-full px-2.5 py-1 transition ${role === 'teacher' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
              >
                מורה
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={saving}
            className="rounded-lg bg-brand-600 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            הוספה
          </button>
        </div>

        <ul className="flex flex-col divide-y divide-slate-50">
          {entries.map((entry) => {
            const isEditing = editingPhone === entry.phone
            return (
              <li key={entry.phone} className="flex items-center justify-between gap-2 py-2.5">
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void saveEdit(entry)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      className="min-w-0 flex-1 rounded-lg border border-brand-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => void saveEdit(entry)}
                      disabled={savingEdit || !editName.trim()}
                      className="shrink-0 rounded-full px-2 py-1 text-xs font-bold text-brand-600 disabled:text-slate-300"
                    >
                      שמירה
                    </button>
                    <button type="button" onClick={cancelEdit} className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-slate-400">
                      ביטול
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">
                        {entry.displayName} · {entry.role === 'teacher' ? 'מורה' : 'הורה'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry.phone} · קוד: {entry.code}
                      </p>
                      <p className={`text-[10px] font-semibold ${isOnline(presence[entry.phone]) ? 'text-leaf-600' : 'text-slate-400'}`}>
                        {isOnline(presence[entry.phone])
                          ? '🟢 מחובר/ת עכשיו'
                          : presence[entry.phone]
                            ? `נראה/תה לאחרונה ${formatRelativeLastSeen(presence[entry.phone])}`
                            : 'מעולם לא התחבר/ה'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        aria-label="עריכת שם"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(entry)}
                        className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                        aria-label="הסרה"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
          {entries.length === 0 && <p className="py-4 text-center text-xs text-slate-400">אין עדיין הרשאות</p>}
        </ul>

        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600">
          סגירה
        </button>
      </div>
    </div>
  )
}
