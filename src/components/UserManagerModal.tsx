import { useState } from 'react'
import { CLASSES } from '../classes'
import { formatRelativeLastSeen, isOnline, useAllPresence } from '../presence'
import {
  clearClassFootprint,
  createUserDoc,
  deleteUserDoc,
  importLegacyAccess,
  updateUserDoc,
  useUsersList,
  type LegacyImportReport,
  type UserEntry,
} from '../firestoreData'
import { INVALID_PHONE_MESSAGE, isValidIsraeliPhone, normalizePhone } from '../phone'
import type { Role } from '../data'
import { PencilIcon, TrashIcon } from './icons'

const CLASS_IDS = Object.keys(CLASSES)
type Choice = Role | 'none'

function randomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

const inputClass = 'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400'

function classesSummary(user: UserEntry): string {
  const parts = Object.entries(user.classes).map(([classId, role]) => `${CLASSES[classId]?.className ?? classId} · ${role === 'teacher' ? 'מורה' : 'הורה'}`)
  return parts.length ? parts.join(' | ') : 'ללא כיתה'
}

// The admin's whole job in one place: add people (one phone = one person = one
// code), choose which class(es) they belong to and in what role, edit or
// remove them. Nobody else - teachers included - can touch this list.
export function UserManager() {
  const users = useUsersList()
  const presence = useAllPresence(CLASS_IDS)
  const [editing, setEditing] = useState<UserEntry | null>(null)
  const [phone, setPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState(randomCode())
  const [choices, setChoices] = useState<Record<string, Choice>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importReport, setImportReport] = useState<LegacyImportReport | null>(null)
  const [importing, setImporting] = useState(false)

  const reset = () => {
    setEditing(null)
    setPhone('')
    setDisplayName('')
    setCode(randomCode())
    setChoices({})
    setError(null)
  }

  const startEdit = (user: UserEntry) => {
    setEditing(user)
    setPhone(user.phone)
    setDisplayName(user.displayName)
    setCode(user.code)
    setChoices({ ...user.classes })
    setError(null)
  }

  const save = async () => {
    setError(null)
    const normalized = editing ? editing.phone : normalizePhone(phone)
    if (!isValidIsraeliPhone(normalized)) return setError(INVALID_PHONE_MESSAGE)
    if (!displayName.trim()) return setError('צריך להזין שם')
    if (code.trim().length < 4 || code.trim().length > 12) return setError('הקוד צריך להיות באורך 4 עד 12 תווים')

    const classes: Record<string, Role> = {}
    for (const classId of CLASS_IDS) {
      const choice = choices[classId]
      if (choice === 'parent' || choice === 'teacher') classes[classId] = choice
    }
    const entry = { phone: normalized, displayName: displayName.trim(), code: code.trim(), classes }

    setSaving(true)
    try {
      if (editing) {
        await updateUserDoc(entry)
        // Left a class: stop sending them its notifications.
        await Promise.all(Object.keys(editing.classes).filter((c) => !(c in classes)).map((c) => clearClassFootprint(c, editing.phone)))
        reset()
      } else {
        const result = await createUserDoc(entry)
        if (result === 'exists') setError('המספר הזה כבר קיים ברשימה - אפשר לערוך אותו משם')
        else reset()
      }
    } catch {
      setError('השמירה נכשלה, נסי שוב')
    } finally {
      setSaving(false)
    }
  }

  const remove = (user: UserEntry) => {
    if (!window.confirm(`להסיר את ${user.displayName}? הוא/היא לא יוכלו יותר להיכנס.`)) return
    void deleteUserDoc(user)
    if (editing?.phone === user.phone) reset()
  }

  const runImport = async () => {
    if (!window.confirm('לייבא את ההרשאות הקיימות של הכיתות לרשימה החדשה? אפשר להריץ שוב בבטחה.')) return
    setImporting(true)
    try {
      setImportReport(await importLegacyAccess(CLASS_IDS, isValidIsraeliPhone))
    } catch {
      setError('הייבוא נכשל, נסי שוב')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <h2 className="mb-1 text-base font-extrabold text-slate-900">ניהול משתמשים</h2>
      <p className="mb-4 text-xs text-slate-500">
        כל אדם מופיע פעם אחת: מספר טלפון + קוד אחד, ושיוך לכיתה אחת או יותר. חלקו את הטלפון והקוד ידנית.
      </p>

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-100 p-3">
        <p className="text-xs font-bold text-slate-700">{editing ? `עריכת ${editing.displayName}` : 'הוספת משתמש'}</p>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="שם (למשל: ליאל אבא של ליב)" className={inputClass} />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="מספר טלפון"
          type="tel"
          inputMode="tel"
          disabled={!!editing}
          className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
        />
        <div className="flex items-center gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="קוד" className={`${inputClass} flex-1`} />
          <button type="button" onClick={() => setCode(randomCode())} className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
            קוד חדש
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {CLASS_IDS.map((classId) => {
            const choice: Choice = choices[classId] ?? 'none'
            return (
              <div key={classId} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs font-semibold text-slate-700">
                  כיתה {CLASSES[classId].className} · {CLASSES[classId].teacherName}
                </span>
                <div className="flex shrink-0 items-center rounded-full bg-slate-100 p-1 text-[11px] font-semibold">
                  {(['none', 'parent', 'teacher'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChoices((prev) => ({ ...prev, [classId]: c }))}
                      className={`rounded-full px-2.5 py-1 transition ${choice === c ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'}`}
                    >
                      {c === 'none' ? 'לא' : c === 'parent' ? 'הורה' : 'מורה'}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          >
            {editing ? 'שמירה' : 'הוספה'}
          </button>
          {editing && (
            <button type="button" onClick={reset} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              ביטול
            </button>
          )}
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-slate-50">
        {users.map((user) => {
          const last = presence[user.phone]
          return (
            <li key={user.phone} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">
                  {user.displayName}
                  {user.admin && <span className="ms-1.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">אדמין</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {user.phone} · קוד: {user.code}
                </p>
                <p className="text-[11px] text-slate-500">{classesSummary(user)}</p>
                <p className={`text-[10px] font-semibold ${isOnline(last) ? 'text-leaf-600' : 'text-slate-400'}`}>
                  {isOnline(last) ? '🟢 מחובר/ת עכשיו' : last ? `נראה/תה לאחרונה ${formatRelativeLastSeen(last)}` : 'מעולם לא התחבר/ה'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(user)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                  aria-label="עריכה"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {!user.admin && (
                  <button
                    type="button"
                    onClick={() => remove(user)}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                    aria-label="הסרה"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
        {users.length === 0 && <p className="py-4 text-center text-xs text-slate-400">אין עדיין משתמשים</p>}
      </ul>

      <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3">
        <p className="mb-2 text-[11px] text-slate-500">מעבר ממערכת ההרשאות הישנה (לפי כיתה): מייבא את כל מי שהוגדר שם, ומאחד מספר טלפון שמופיע בכמה כיתות.</p>
        <button
          type="button"
          onClick={() => void runImport()}
          disabled={importing}
          className="w-full rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-600 disabled:opacity-60"
        >
          {importing ? 'מייבא...' : 'ייבוא הרשאות קיימות'}
        </button>
        {importReport && (
          <div className="mt-2 text-[11px] leading-relaxed text-slate-600">
            <p>
              נוספו {importReport.created} · עודכנו {importReport.merged}
            </p>
            {importReport.conflicts.length > 0 && (
              <p className="text-amber-600">קודים שונים בין כיתות (נשמר הקוד מהכיתה הראשונה): {importReport.conflicts.join(', ')}</p>
            )}
            {importReport.skipped.length > 0 && (
              <p className="text-rose-600">דולגו - טלפון/קוד לא תקינים, הוסיפו ידנית: {importReport.skipped.join(', ')}</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default function UserManagerModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <UserManager />
        <button type="button" onClick={onClose} className="mt-4 w-full rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600">
          סגירה
        </button>
      </div>
    </div>
  )
}
