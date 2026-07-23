import type { AnalyticsRaw } from './stats'
import type { OrderStatus } from './orders'
import { CATEGORY_LABELS_AR, type Category } from '../products'

/**
 * Pure, side-effect-free aggregation for the admin dashboard. All numbers are
 * derived from the fetched rows — no fabricated data — and every path guards
 * against empty input (no NaN, no Infinity), so the UI can render cleanly even
 * with only a handful of orders.
 */

export type RangeKey = '7d' | '30d' | 'all'

export interface RevenuePoint {
  label: string
  revenue: number
}
export interface ActivityPoint {
  label: string
  orders: number
  bookings: number
}
export interface Slice {
  name: string
  value: number
}
export interface StatusSlice extends Slice {
  key: OrderStatus
}
export interface TopProduct {
  name: string
  qty: number
}
export interface Kpis {
  revenue: number
  orders: number
  avgOrder: number
  bookings: number
}
export interface Analytics {
  revenue: RevenuePoint[]
  activity: ActivityPoint[]
  categories: Slice[]
  statuses: StatusSlice[]
  topProducts: TopProduct[]
  kpis: Kpis
  hasOrders: boolean
  hasActivity: boolean
  hasCategories: boolean
  hasTop: boolean
}

const DAY = 86_400_000
const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const fmtDM = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'جديد',
  confirmed: 'مؤكد',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
}
const STATUS_ORDER: OrderStatus[] = ['new', 'confirmed', 'delivered', 'cancelled']

/** Aggregate the raw rows for a given range. `now` is injected for determinism. */
export function buildAnalytics(raw: AnalyticsRaw, range: RangeKey, now: Date): Analytics {
  const today = dayStart(now)
  const rangeStartMs =
    range === 'all'
      ? -Infinity
      : range === '7d'
        ? today.getTime() - 6 * DAY
        : today.getTime() - 29 * DAY

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime()
    return Number.isFinite(t) && t >= rangeStartMs
  }
  const orders = raw.orders.filter((o) => inRange(o.created_at))
  const bookings = raw.bookings.filter((b) => inRange(b.created_at))
  const catById = new Map<string, Category>(raw.products.map((p) => [p.id, p.category]))

  // ---- Time buckets: per-day for 7d/30d, per-week for "all" ----
  const starts: Date[] = []
  let step = DAY
  if (range === '7d' || range === '30d') {
    const count = range === '7d' ? 7 : 30
    const first = new Date(today.getTime() - (count - 1) * DAY)
    for (let i = 0; i < count; i++) starts.push(new Date(first.getTime() + i * DAY))
  } else {
    step = 7 * DAY
    const times = [...orders, ...bookings]
      .map((x) => new Date(x.created_at).getTime())
      .filter((t) => Number.isFinite(t))
    if (times.length) {
      const first = dayStart(new Date(Math.min(...times)))
      const weeks = Math.floor((today.getTime() - first.getTime()) / step) + 1
      for (let i = 0; i < weeks; i++) starts.push(new Date(first.getTime() + i * step))
    }
  }
  const idxOf = (iso: string): number => {
    if (!starts.length) return -1
    const t = dayStart(new Date(iso)).getTime()
    const i = Math.floor((t - starts[0].getTime()) / step)
    return i >= 0 && i < starts.length ? i : -1
  }

  const revenue: RevenuePoint[] = starts.map((s) => ({ label: fmtDM(s), revenue: 0 }))
  const activity: ActivityPoint[] = starts.map((s) => ({ label: fmtDM(s), orders: 0, bookings: 0 }))
  for (const o of orders) {
    const i = idxOf(o.created_at)
    if (i >= 0) {
      revenue[i].revenue += Number(o.total) || 0
      activity[i].orders += 1
    }
  }
  for (const b of bookings) {
    const i = idxOf(b.created_at)
    if (i >= 0) activity[i].bookings += 1
  }

  // ---- Revenue by category (resolved from productId → products.category) ----
  const catMap = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items ?? []) {
      const cat = catById.get(it.productId)
      const label = cat ? CATEGORY_LABELS_AR[cat] : 'أخرى'
      const rev = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
      if (rev > 0) catMap.set(label, (catMap.get(label) ?? 0) + rev)
    }
  }
  const categories: Slice[] = Array.from(catMap, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  )

  // ---- Orders by status ----
  const statusCount = new Map<OrderStatus, number>()
  for (const o of orders) statusCount.set(o.status, (statusCount.get(o.status) ?? 0) + 1)
  const statuses: StatusSlice[] = STATUS_ORDER.filter((s) => (statusCount.get(s) ?? 0) > 0).map(
    (s) => ({ key: s, name: ORDER_STATUS_LABELS[s], value: statusCount.get(s) ?? 0 }),
  )

  // ---- Top products by quantity sold ----
  const qtyMap = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items ?? []) {
      const name = (it.name_ar || '').trim() || 'منتج'
      qtyMap.set(name, (qtyMap.get(name) ?? 0) + (Number(it.quantity) || 0))
    }
  }
  const topProducts: TopProduct[] = Array.from(qtyMap, ([name, qty]) => ({ name, qty }))
    .filter((x) => x.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  const revSum = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
  const kpis: Kpis = {
    revenue: revSum,
    orders: orders.length,
    avgOrder: orders.length ? revSum / orders.length : 0,
    bookings: bookings.length,
  }

  return {
    revenue,
    activity,
    categories,
    statuses,
    topProducts,
    kpis,
    hasOrders: orders.length > 0,
    hasActivity: orders.length > 0 || bookings.length > 0,
    hasCategories: categories.length > 0,
    hasTop: topProducts.length > 0,
  }
}
