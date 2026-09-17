import { classInfo } from '../data'

interface Stat {
  label: string
  value: string
  icon: string
}

export default function ClassHero() {
  const stats: Stat[] = [
    { label: 'תלמידים בכיתה', value: String(classInfo.studentsCount), icon: '🧒' },
    { label: 'נוכחים היום', value: `${classInfo.presentToday}/${classInfo.studentsCount}`, icon: '✅' },
    { label: 'אירועים קרובים', value: '3', icon: '📅' },
    { label: 'הודעות השבוע', value: '7', icon: '💬' },
  ]

  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-brand-600 via-brand-600 to-brand-500 text-white shadow-lg shadow-brand-200/60">
      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-bold ring-2 ring-white/30">
            {classInfo.teacherInitials}
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              כיתה {classInfo.className}
            </div>
            <h1 className="text-xl font-extrabold sm:text-2xl">המורה {classInfo.teacherName}</h1>
            <p className="text-sm text-brand-50/90">{classInfo.schoolName} · שנת הלימודים תשפ"ו</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-white/15 bg-white/10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-brand-600/40 px-4 py-4 text-center sm:text-start">
            <p className="text-lg font-extrabold sm:text-xl">
              <span className="me-1">{s.icon}</span>
              {s.value}
            </p>
            <p className="text-xs text-brand-50/80">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
