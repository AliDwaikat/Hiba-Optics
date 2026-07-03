import { supabase } from '../supabase'

/** Dashboard row counts (head-only queries — no rows fetched). */
export interface DashboardCounts {
  products: number
  orders: number
  bookings: number
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
