import { useEffect, useMemo, useState } from 'react'
import { fetchCustomers, type Customer } from '../../lib/admin/customers'

type SortDir = 'newest' | 'oldest'

/** Join date with Western digits (dd/mm/yyyy). */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** First letter of the name (else the email), for the avatar circle. */
function initialOf(c: Customer): string {
  const src = (c.name && c.name.trim()) || (c.email && c.email.trim()) || '?'
  return src[0]!.toUpperCase()
}

function Avatar({ customer }: { customer: Customer }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-ink"
    >
      <span className="num">{initialOf(customer)}</span>
    </span>
  )
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white shadow-card">
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-40 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-56 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortDir>('newest')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchCustomers()
      .then((rows) => {
        if (!active) return
        setCustomers(rows)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? customers.filter(
          (c) =>
            (c.name ?? '').toLowerCase().includes(q) ||
            (c.email ?? '').toLowerCase().includes(q),
        )
      : customers
    // Copy before sorting so we never mutate state.
    const sorted = [...filtered].sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return sort === 'newest' ? tb - ta : ta - tb
    })
    return sorted
  }, [customers, search, sort])

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">العملاء</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{customers.length} عميل</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد الإلكتروني…"
          aria-label="بحث"
          className="field sm:max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortDir)}
          aria-label="الترتيب"
          className="field sm:w-44"
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
        </select>
      </div>

      {/* Body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonTable />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">تعذّر تحميل العملاء</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا يوجد عملاء مسجّلون بعد</p>
            <p className="mt-2 text-sm text-gray-600">
              سيظهر العملاء هنا فور إنشائهم حساباً على المتجر.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا يوجد عملاء مطابقون</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-xs font-semibold text-gray-600">
                    <th scope="col" className="px-4 py-3 text-start font-semibold">
                      العميل
                    </th>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-start font-semibold">
                      تاريخ الانضمام
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visible.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar customer={c} />
                          <span className="font-medium text-ink">
                            {c.name && c.name.trim() ? c.name : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            dir="ltr"
                            className="inline-block text-start text-gray-700 transition-colors hover:text-yellow-deep"
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="num text-gray-600" dir="ltr">
                          {formatDate(c.created_at)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
