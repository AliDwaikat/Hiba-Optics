import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'
import { format, type UIKey } from '../../lib/i18n'
import { formatPrice } from '../../lib/format'
import { fetchMyOrders, type CustomerOrder, type OrderStatus } from '../../lib/orders'
import { Skeleton } from '../../components/Skeleton'

const CURRENCY = 'ILS'

/** Status → { i18n key, badge colors } — mirrors the admin order palette. */
const STATUS_META: Record<OrderStatus, { key: UIKey; bg: string; fg: string }> = {
  new: { key: 'orders.status.new', bg: 'var(--color-yellow)', fg: 'var(--color-ink)' },
  confirmed: { key: 'orders.status.confirmed', bg: '#dbeafe', fg: '#1e40af' },
  delivered: { key: 'orders.status.delivered', bg: '#dcfce7', fg: '#15803d' },
  cancelled: { key: 'orders.status.cancelled', bg: '#fee2e2', fg: '#b91c1c' },
}

/** dd/mm/yyyy with Western digits. */
function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage()
  const m = STATUS_META[status] ?? STATUS_META.new
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      {t(m.key)}
    </span>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-5 shadow-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-56 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AccountOrders() {
  const { user, loading: authLoading } = useCustomerAuth()
  const { t, localize } = useLanguage()
  const reduce = useReducedMotion()

  const [orders, setOrders] = useState<CustomerOrder[] | null>(null) // null = loading
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    setOrders(null)
    setError(null)
    fetchMyOrders(user.id)
      .then((rows) => {
        if (active) setOrders(rows)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
        setOrders([])
      })
    return () => {
      active = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wait for the session to resolve before deciding.
  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <span className="text-sm text-gray-500">…</span>
      </main>
    )
  }

  // Not logged in → login (lightweight customer check, NOT the admin guard).
  if (!user) return <Navigate to="/account/login" replace />

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{t('orders.title')}</h1>
        {orders && orders.length > 0 && (
          <p className="num text-sm text-gray-600">{format(t('orders.count'), { n: orders.length })}</p>
        )}
      </div>

      <div className="mt-8">
        {orders === null ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">{t('orders.error')}</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">{t('orders.empty')}</p>
            <Link to="/shop" className="btn btn-primary mt-6">
              {t('common.browseShop')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o, idx) => (
              <motion.div
                key={o.id}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut', delay: reduce ? 0 : idx * 0.04 }}
                className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="num font-bold text-ink" dir="ltr">
                      {o.order_number}
                    </p>
                    <p className="num mt-0.5 text-xs text-gray-600" dir="ltr">
                      {formatDate(o.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>

                {/* Items summary */}
                <ul className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-gray-700">
                      <span>
                        {it.name_ar}
                        {it.color && (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            {' — '}
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-gray-300 align-middle"
                              style={{ backgroundColor: it.color.hex }}
                              aria-hidden="true"
                            />
                            {localize(it.color, 'name')}
                          </span>
                        )}
                        {it.size && (
                          <span className="num text-gray-600">
                            {' · '}
                            {t('cart.size')}: <span dir="ltr">{it.size}</span>
                          </span>
                        )}
                      </span>
                      <span className="num shrink-0 text-gray-600">× {it.quantity}</span>
                    </li>
                  ))}
                </ul>

                {o.has_consultation_items && (
                  <p className="mt-3 inline-flex items-center rounded-full bg-[rgba(254,201,2,0.15)] px-2.5 py-1 text-xs font-medium text-ink">
                    {t('card.consultation')}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-600">{t('orders.total')}</span>
                  <span className="num font-bold text-ink">{formatPrice(o.total, CURRENCY)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
