import { supabase } from '../supabase'
import type { OrderItemSnapshot } from '../orders'
import type { OrderStatus } from './orders'
import type { BookingStatus } from './bookings'
import type { Category } from '../products'

/** Dashboard row counts (head-only queries — no rows fetched). */
export interface DashboardCounts {
  products: number
  orders: number
  bookings: number
}

/* ---- Analytics: minimal rows fetched, aggregated client-side ---- */

export interface AnalyticsOrderRow {
  total: number
  status: OrderStatus
  items: OrderItemSnapshot[]
  created_at: string
}
export interface AnalyticsBookingRow {
  status: BookingStatus
  created_at: string
}
export interface AnalyticsProductRow {
  id: string
  category: Category
  name_ar: string
}
export interface AnalyticsRaw {
  orders: AnalyticsOrderRow[]
  bookings: AnalyticsBookingRow[]
  products: AnalyticsProductRow[]
}

/**
 * Fetch the rows the dashboard aggregates from (orders + bookings + a product
 * category lookup). Small tables — pulled once and crunched client-side.
 * Throws (with the first failing query's message) so the caller can show an
 * error state.
 */
export async function fetchAnalyticsRaw(): Promise<AnalyticsRaw> {
  const [o, b, p] = await Promise.all([
    supabase.from('orders').select('total, status, items, created_at'),
    supabase.from('bookings').select('status, created_at'),
    supabase.from('products').select('id, category, name_ar'),
  ])
  if (o.error) throw new Error(o.error.message)
  if (b.error) throw new Error(b.error.message)
  if (p.error) throw new Error(p.error.message)

  const orders: AnalyticsOrderRow[] = (o.data ?? []).map((r) => {
    const row = r as { total: unknown; status: OrderStatus; items: unknown; created_at: string }
    return {
      total: Number(row.total) || 0,
      status: row.status,
      items: Array.isArray(row.items) ? (row.items as OrderItemSnapshot[]) : [],
      created_at: row.created_at,
    }
  })
  return {
    orders,
    bookings: (b.data ?? []) as unknown as AnalyticsBookingRow[],
    products: (p.data ?? []) as unknown as AnalyticsProductRow[],
  }
}

async function countRows(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Fetch the products / orders / bookings totals for the dashboard cards. */
export async function fetchDashboardCounts(): Promise<DashboardCounts> {
  const [products, orders, bookings] = await Promise.all([
    countRows('products'),
    countRows('orders'),
    countRows('bookings'),
  ])
  return { products, orders, bookings }
}
