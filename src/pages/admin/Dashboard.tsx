const STATS = [
  { label: 'المنتجات', value: '—' },
  { label: 'الطلبات', value: '—' },
  { label: 'الحجوزات', value: '—' },
]

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-ink">أهلاً بك في لوحة تحكم هبة أوبتكس</h2>
      <p className="mt-2 text-sm text-gray-600">نظرة عامة سريعة — سيتم ربط الأرقام لاحقاً.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card">
            <p className="text-sm text-gray-600">{s.label}</p>
            <p className="num mt-2 text-3xl font-extrabold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
