import { useEffect, useMemo, useRef, useState } from 'react'
import { formatPrice } from '../../lib/format'
import { telLink } from '../../lib/contact'
import {
  fetchAdminOrders,
  fetchOrderBranches,
  updateOrderStatus,
  type AdminOrder,
  type OrderBranch,
  type OrderStatus,
} from '../../lib/admin/orders'
import { Skeleton } from '../../components/Skeleton'

/* Orders carry no currency column; the storefront prices in ILS. */
const CURRENCY = 'ILS'

const STATUS_META: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  new: { label: 'جديد', bg: 'var(--color-yellow)', fg: 'var(--color-ink)' },
  confirmed: { label: 'مؤكد', bg: '#dbeafe', fg: '#1e40af' },
  delivered: { label: 'تم التسليم', bg: '#dcfce7', fg: '#15803d' },
  cancelled: { label: 'ملغي', bg: '#fee2e2', fg: '#b91c1c' },
}

const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'delivered', 'cancelled']

const STATUS_TABS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'new', label: 'جديد' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'delivered', label: 'تم التسليم' },
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

function StatusBadge({ status }: { status: OrderStatus }) {
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
              <Skeleton className="h-4 w-40 rounded" />
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
function OrderDetail({
  order,
  branchName,
  saving,
  onStatusChange,
}: {
  order: AdminOrder
  branchName?: string
  saving: boolean
  onStatusChange: (s: OrderStatus) => void
}) {
  const items = Array.isArray(order.items) ? order.items : []
  return (
    <div className="border-t border-gray-300 px-5 py-4">
      {/* Status control */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`status-${order.id}`} className="text-sm font-medium text-ink">
          الحالة
        </label>
        <select
          id={`status-${order.id}`}
          className="field w-40"
          value={order.status}
          disabled={saving}
          onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        {saving && <span className="text-xs text-gray-600">جارٍ الحفظ…</span>}
      </div>

      {/* Items */}
      <div className="mt-5">
        <h4 className="text-sm font-bold text-ink">المنتجات</h4>
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-gray-300 px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{it.name_ar}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span className="num">
                    {it.quantity} × {formatPrice(Number(it.unit_price), CURRENCY)}
                  </span>
                  {it.color && (
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: it.color.hex }}
                        aria-hidden="true"
                      />
                      {it.color.name_ar}
                    </span>
                  )}
                  {it.requiresConsultation && (
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: 'var(--color-yellow)', color: 'var(--color-ink)' }}
                    >
                      حجز / فحص نظر
                    </span>
                  )}
                </div>
              </div>
              <span className="num shrink-0 font-semibold text-ink">
                {formatPrice(Number(it.unit_price) * Number(it.quantity), CURRENCY)}
              </span>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-gray-600">لا توجد تفاصيل منتجات.</li>}
        </ul>
      </div>

      {/* Delivery address / branch */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold text-ink">
            {order.fulfillment_type === 'delivery' ? 'عنوان التوصيل' : 'الاستلام من الفرع'}
          </h4>
          {order.fulfillment_type === 'delivery' ? (
            <p className="mt-1 text-sm text-gray-600">
              {[order.address, order.city].filter(Boolean).join('، ') || '—'}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">{branchName ?? '—'}</p>
          )}
        </div>
        {order.notes && (
          <div>
            <h4 className="text-sm font-bold text-ink">ملاحظات</h4>
            <p className="mt-1 text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Price breakdown */}
      <div className="mt-5 max-w-xs space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">المجموع الفرعي</span>
          <span className="num text-ink">{formatPrice(Number(order.subtotal), CURRENCY)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">رسوم التوصيل</span>
          <span className="num text-ink">{formatPrice(Number(order.delivery_fee), CURRENCY)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-300 pt-1.5">
          <span className="font-bold text-ink">الإجمالي</span>
          <span className="num font-bold text-ink">{formatPrice(Number(order.total), CURRENCY)}</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [branches, setBranches] = useState<OrderBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
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
    Promise.all([fetchAdminOrders(), fetchOrderBranches().catch(() => [] as OrderBranch[])])
      .then(([ords, brs]) => {
        if (!active) return
        setOrders(ords)
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
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (q) {
        const numMatch = o.order_number.toLowerCase().includes(q)
        const phoneMatch =
          qDigits.length > 0 && o.customer_phone.replace(/\D/g, '').includes(qDigits)
        if (!numMatch && !phoneMatch) return false
      }
      return true
    })
  }, [orders, statusFilter, search])

  async function handleStatusChange(order: AdminOrder, status: OrderStatus) {
    if (order.status === status || savingIds.has(order.id)) return
    const prev = order.status

    setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status } : o)))
    setSavingIds((s) => new Set(s).add(order.id))
    try {
      await updateOrderStatus(order.id, status)
      showToast('تم تحديث الحالة', 'success')
    } catch {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: prev } : o)))
      showToast('تعذّر تحديث الحالة، حاول مرة أخرى', 'error')
    } finally {
      setSavingIds((s) => {
        const n = new Set(s)
        n.delete(order.id)
        return n
      })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الطلبات</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{orders.length} طلب</p>
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
          placeholder="ابحث برقم الطلب أو الهاتف…"
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
            <p className="text-lg text-ink">تعذّر تحميل الطلبات</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const open = expandedId === o.id
              const branchName = o.branch_id ? branchNameById.get(o.branch_id) : undefined
              return (
                <div
                  key={o.id}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white shadow-card"
                >
                  {/* Header (toggles detail) */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : o.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-5 py-4 text-right transition-colors hover:bg-gray-100/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="num font-bold text-ink" dir="ltr">
                          {o.order_number}
                        </span>
                        <StatusBadge status={o.status} />
                        <span
                          className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                        >
                          {o.fulfillment_type === 'delivery' ? 'توصيل' : 'استلام'}
                          {o.fulfillment_type === 'pickup' && branchName ? ` · ${branchName}` : ''}
                        </span>
                        {o.has_consultation_items && (
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-yellow) 22%, transparent)',
                              color: 'var(--color-ink)',
                            }}
                          >
                            يحتوي فحص نظر
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span className="text-ink">{o.customer_name}</span>
                        <span className="num" dir="ltr">
                          {formatDateTime(o.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="num shrink-0 text-base font-bold text-ink">
                      {formatPrice(Number(o.total), CURRENCY)}
                    </span>
                    <ChevronIcon open={open} />
                  </button>

                  {/* Contact actions */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-3">
                    <a
                      href={telLink(o.customer_phone)}
                      dir="ltr"
                      className="num text-sm text-ink transition-colors hover:text-yellow-deep"
                    >
                      {o.customer_phone}
                    </a>
                    <a
                      href={waLink(o.customer_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100"
                    >
                      <WhatsAppIcon />
                      تواصل مع العميل
                    </a>
                  </div>

                  {open && (
                    <OrderDetail
                      order={o}
                      branchName={branchName}
                      saving={savingIds.has(o.id)}
                      onStatusChange={(s) => handleStatusChange(o, s)}
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
