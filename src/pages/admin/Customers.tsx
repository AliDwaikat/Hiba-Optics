import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  fetchCustomers,
  updateCustomerRenewal,
  type Customer,
} from '../../lib/admin/customers'
import { renewalStatus } from '../../lib/renewal'
import { Skeleton } from '../../components/Skeleton'

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

/** A due/overdue chip for a customer's renewal date (nothing when not due). */
function RenewalBadge({ date }: { date: string | null }) {
  const status = renewalStatus(date)
  if (status === 'none') return null
  const overdue = status === 'overdue'
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={
        overdue
          ? { backgroundColor: '#fee2e2', color: '#b91c1c' }
          : { backgroundColor: 'var(--color-yellow)', color: 'var(--color-ink)' }
      }
    >
      {overdue ? 'متأخّر' : 'قريباً'}
    </span>
  )
}

/* ---- Edit renewal reminder modal ---- */
function RenewalModal({
  customer,
  saving,
  saveError,
  onCancel,
  onSubmit,
}: {
  customer: Customer
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSubmit: (date: string | null, note: string | null) => void
}) {
  const [date, setDate] = useState(customer.renewal_date?.slice(0, 10) ?? '')
  const [note, setNote] = useState(customer.renewal_note ?? '')

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    onSubmit(date.trim() || null, note.trim() || null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="تذكير التجديد"
    >
      <div
        onClick={saving ? undefined : onCancel}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
        className="absolute inset-0"
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
      >
        <h3 className="text-lg font-bold text-ink">تذكير التجديد</h3>
        <p className="mt-1 text-sm text-gray-600">{customer.name?.trim() || customer.email || '—'}</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="rn-date" className="mb-1.5 block text-sm font-medium text-ink">
              تاريخ التجديد
            </label>
            <input
              id="rn-date"
              type="date"
              dir="ltr"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rn-note" className="mb-1.5 block text-sm font-medium text-ink">
              الملاحظة
            </label>
            <input
              id="rn-note"
              type="text"
              className="field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="تجديد عدسات لاصقة / فحص نظر"
            />
          </div>

          {saveError && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {saveError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-start gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary w-28">
            {saving ? 'جاري الحفظ…' : 'حفظ'}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="btn btn-secondary">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
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
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
            <Skeleton className="h-3 w-24 rounded" />
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

  // Renewal edit modal + toast.
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  function showToast(text: string, kind: 'success' | 'error') {
    window.clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  async function handleSaveRenewal(date: string | null, note: string | null) {
    if (!editTarget) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateCustomerRenewal(editTarget.id, { renewal_date: date, renewal_note: note })
      setCustomers((cs) =>
        cs.map((c) => (c.id === editTarget.id ? { ...c, renewal_date: date, renewal_note: note } : c)),
      )
      setEditTarget(null)
      showToast('تم حفظ التذكير', 'success')
    } catch {
      setSaveError('تعذّر حفظ التذكير، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

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
                    <th scope="col" className="whitespace-nowrap px-4 py-3 text-start font-semibold">
                      تذكير التجديد
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
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.renewal_date ? (
                            <span className="flex flex-col">
                              <span className="flex items-center gap-2">
                                <span className="num text-gray-700" dir="ltr">
                                  {formatDate(c.renewal_date)}
                                </span>
                                <RenewalBadge date={c.renewal_date} />
                              </span>
                              {c.renewal_note && (
                                <span className="text-xs text-gray-500">{c.renewal_note}</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSaveError(null)
                              setEditTarget(c)
                            }}
                            className="ms-1 text-sm font-medium text-yellow-deep transition-colors hover:text-ink"
                          >
                            {c.renewal_date ? 'تعديل' : 'تعيين'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Renewal edit modal */}
      {editTarget && (
        <RenewalModal
          key={editTarget.id}
          customer={editTarget}
          saving={saving}
          saveError={saveError}
          onCancel={() => (saving ? undefined : setEditTarget(null))}
          onSubmit={handleSaveRenewal}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
          <div
            className="rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-white shadow-card"
            style={{
              backgroundColor: toast.kind === 'success' ? 'var(--color-ink)' : 'var(--color-error)',
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  )
}
