import { dutyRoster } from '../data'

const today = 'שלישי'

export default function DutyRoster() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
        <span>🧺</span> תורנות הורים השבוע
      </h2>
      <ul className="flex flex-col gap-2">
        {dutyRoster.map((d) => (
          <li
            key={d.day}
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm ${
              d.day === today ? 'bg-sun-50 ring-1 ring-sun-200' : 'bg-slate-50/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-11 text-xs font-bold ${d.day === today ? 'text-sun-600' : 'text-slate-400'}`}>
                יום {d.day}
              </span>
              <span className="font-semibold text-slate-800">{d.parent}</span>
            </div>
            <span className="text-xs text-slate-500">{d.task}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
