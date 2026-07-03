import { useEffect, useState } from 'react'
import { fetchDashboardCounts, type DashboardCounts } from '../../lib/admin/stats'

const CARDS: { key: keyof DashboardCounts; label: string }[] = [
  { key: 'products', label: 'المنتجات' },
  { key: 'orders', label: 'الطلبات' },
  { key: 'bookings', label: 'الحجوزات' },
]

export default function Dashboard() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    fetchDashboardCounts()
      .then((c) => active && setCounts(c))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-ink">أهلاً بك في لوحة تحكم هبة أوبتكس</h2>
      <p className="mt-2 text-sm text-gray-600">نظرة عامة سريعة على المتجر.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => {
          const value = counts ? String(counts[c.key]) : failed ? '—' : ''
          return (
            <div
              key={c.key}
              className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
            >
              <p className="text-sm text-gray-600">{c.label}</p>
              {value === '' ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-100" />
              ) : (
                <p className="num mt-2 text-3xl font-extrabold text-ink">{value}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
