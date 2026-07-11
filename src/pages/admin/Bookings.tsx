import { useEffect, useMemo, useRef, useState } from 'react'
import { telLink } from '../../lib/contact'
import type { BookingService } from '../../lib/bookings'
import {
  fetchAdminBookings,
  fetchBookingBranches,
  updateBookingStatus,
  type AdminBooking,
  type BookingBranch,
  type BookingStatus,
} from '../../lib/admin/bookings'
import { Skeleton } from '../../components/Skeleton'

const SERVICE_LABELS: Record<BookingService, string> = {
  eye_exam: 'فحص نظر',
  glasses_consult: 'استشارة نظارة',
  general: 'استفسار عام',
}

const STATUS_META: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  new: { label: 'جديد', bg: 'var(--color-yellow)', fg: 'var(--color-ink)' },
  confirmed: { label: 'مؤكد', bg: '#dbeafe', fg: '#1e40af' },
  done: { label: 'تم', bg: '#dcfce7', fg: '#15803d' },
  cancelled: { label: 'ملغي', bg: '#fee2e2', fg: '#b91c1c' },
}

const STATUS_ORDER: BookingStatus[] = ['new', 'confirmed', 'done', 'cancelled']

const STATUS_TABS: { value: 'all' | BookingStatus; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديد' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'done', label: 'تم' },
  { value: 'cancelled', label: 'ملغي' },
]

function pillClass(active: boolean): string {
  return [
    'whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
    active ? 'bg-yellow font-semibold text-ink' : 'bg-gray-100 text-gray-600 hover:text-ink',
  ].join(' ')
}

/** wa.me link with a normalized number (local 0-prefix → 970, drop 00 prefix). */
function waLink(phone: string): string {
  let d = (phone || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '970' + d.slice(1)
  return `https://wa.me/${d}`
}

/** Date + time with Western digits (dd/mm/yyyy · HH:MM, 24h). */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${date} · ${time}`
}

/** Date-only (dd/mm/yyyy, Western digits) for the preferred_date column. */
function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/** Preferred date + time for display; "—" when nothing is set. */
function preferredSlot(date: string | null, time: string | null): string {
  const d = date ? formatDate(date) : ''
  const t = time ? time.trim() : ''
  const parts = [d, t].filter(Boolean)
  return parts.length ? parts.join(' · ') : '—'
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 5.73 13.83 8.1 8.1 0 0 1-9.9 1.23l-.36-.21-3.03.79.81-2.95-.24-.38A8.1 8.1 0 0 1 12.04 3.8Zm-2.6 4.03c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72s.74 2 .84 2.14c.1.14 1.44 2.3 3.56 3.13 1.76.7 2.12.56 2.5.52.38-.03 1.23-.5 1.4-.99.18-.48.18-.9.13-.99-.05-.09-.19-.14-.4-.24-.21-.1-1.23-.61-1.42-.68-.19-.07-.33-.1-.47.1-.14.21-.54.68-.66.82-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.24-1.16-1.45-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.36-.05-.1-.46-1.13-.64-1.55-.16-.4-.33-.35-.46-.36l-.39-.01Z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-44 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-56 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Expanded detail ---- */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-600">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  )
}

function BookingDetail({
  booking,
  branchName,
  saving,
  onStatusChange,
}: {
  booking: AdminBooking
  branchName?: string
  saving: boolean
  onStatusChange: (s: BookingStatus) => void
}) {
  return (
    <div className="border-t border-gray-300 px-5 py-4">
      {/* Status control */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`status-${booking.id}`} className="text-sm font-medium text-ink">
          الحالة
        </label>
        <select
          id={`status-${booking.id}`}
          className="field w-40"
          value={booking.status}
          disabled={saving}
          onChange={(e) => onStatusChange(e.target.value as BookingStatus)}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        {saving && <span className="text-xs text-gray-600">جارٍ الحفظ…</span>}
      </div>

      {/* All fields */}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailRow label="رقم الحجز" value={booking.booking_number} />
        <DetailRow label="الاسم" value={booking.name} />
        <DetailRow label="الهاتف" value={booking.phone} />
        <DetailRow label="الخدمة" value={SERVICE_LABELS[booking.service]} />
        <DetailRow label="الفرع" value={branchName ?? '—'} />
        <DetailRow
          label="الموعد المفضّل"
          value={preferredSlot(booking.preferred_date, booking.preferred_time)}
        />
        <DetailRow label="تاريخ الطلب" value={formatDateTime(booking.created_at)} />
      </dl>

      {/* Notes */}
      <div className="mt-5">
        <h4 className="text-sm font-bold text-ink">ملاحظات</h4>
        <p className="mt-1 text-sm text-gray-600">{booking.notes?.trim() || 'لا توجد ملاحظات.'}</p>
      </div>
    </div>
  )
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [branches, setBranches] = useState<BookingBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())

  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  function showToast(text: string, kind: 'success' | 'error') {
    window.clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([fetchAdminBookings(), fetchBookingBranches().catch(() => [] as BookingBranch[])])
      .then(([bks, brs]) => {
        if (!active) return
        setBookings(bks)
        setBranches(brs)
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

  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name_ar])),
    [branches],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false
      if (q) {
        const numMatch = b.booking_number.toLowerCase().includes(q)
        const phoneMatch = qDigits.length > 0 && b.phone.replace(/\D/g, '').includes(qDigits)
        if (!numMatch && !phoneMatch) return false
      }
      return true
    })
  }, [bookings, statusFilter, search])

  async function handleStatusChange(booking: AdminBooking, status: BookingStatus) {
    if (booking.status === status || savingIds.has(booking.id)) return
    const prev = booking.status

    setBookings((bs) => bs.map((b) => (b.id === booking.id ? { ...b, status } : b)))
    setSavingIds((s) => new Set(s).add(booking.id))
    try {
      await updateBookingStatus(booking.id, status)
      showToast('تم تحديث الحالة', 'success')
    } catch {
      setBookings((bs) => bs.map((b) => (b.id === booking.id ? { ...b, status: prev } : b)))
      showToast('تعذّر تحديث الحالة، حاول مرة أخرى', 'error')
    } finally {
      setSavingIds((s) => {
        const n = new Set(s)
        n.delete(booking.id)
        return n
      })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الحجوزات</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{bookings.length} حجز</p>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={pillClass(statusFilter === tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الحجز أو الهاتف…"
          aria-label="بحث"
          className="field sm:max-w-xs"
        />
      </div>

      {/* Body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">تعذّر تحميل الحجوزات</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد حجوزات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const open = expandedId === b.id
              const branchName = b.branch_id ? branchNameById.get(b.branch_id) : undefined
              return (
                <div
                  key={b.id}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white shadow-card"
                >
                  {/* Header (toggles detail) */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : b.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-5 py-4 text-right transition-colors hover:bg-gray-100/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="num font-bold text-ink" dir="ltr">
                          {b.booking_number}
                        </span>
                        <StatusBadge status={b.status} />
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                          {SERVICE_LABELS[b.service]}
                        </span>
                        {branchName && (
                          <span className="text-xs text-gray-600">{branchName}</span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span className="text-ink">{b.name}</span>
                        <span className="num">
                          الموعد: {preferredSlot(b.preferred_date, b.preferred_time)}
                        </span>
                        <span className="num" dir="ltr">
                          {formatDateTime(b.created_at)}
                        </span>
                      </div>
                    </div>
                    <ChevronIcon open={open} />
                  </button>

                  {/* Contact actions */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-3">
                    <a
                      href={telLink(b.phone)}
                      dir="ltr"
                      className="num text-sm text-ink transition-colors hover:text-yellow-deep"
                    >
                      {b.phone}
                    </a>
                    <a
                      href={waLink(b.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100"
                    >
                      <WhatsAppIcon />
                      تواصل
                    </a>
                  </div>

                  {open && (
                    <BookingDetail
                      booking={b}
                      branchName={branchName}
                      saving={savingIds.has(b.id)}
                      onStatusChange={(s) => handleStatusChange(b, s)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" aria-live="polite">
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
