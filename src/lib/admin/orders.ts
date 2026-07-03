import { supabase } from '../supabase'
import type { FulfillmentType, OrderItemSnapshot } from '../orders'

/**
 * Admin data layer for orders. Reads every order (newest first) and updates
 * status. Column names mirror the Supabase `orders` table exactly — do not
 * rename.
 */

export type OrderStatus = 'new' | 'confirmed' | 'delivered' | 'cancelled'

export interface AdminOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  fulfillment_type: FulfillmentType
  branch_id: string | null
  address: string | null
  city: string | null
  items: OrderItemSnapshot[]
  subtotal: number
  delivery_fee: number
  total: number
  payment_method: string
  status: OrderStatus
  has_consultation_items: boolean
  notes: string | null
  created_at: string
}

/** Minimal branch shape for resolving pickup branch names. */
export interface OrderBranch {
  id: string
  name_ar: string
}

const ORDER_COLUMNS =
  'id, order_number, customer_name, customer_phone, fulfillment_type, branch_id, ' +
  'address, city, items, subtotal, delivery_fee, total, payment_method, status, ' +
  'has_consultation_items, notes, created_at'

/** Every order, newest first. */
export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminOrder[]
}

/** All branches (id + Arabic name) — resolves pickup branch names. */
export async function fetchOrderBranches(): Promise<OrderBranch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name_ar')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as OrderBranch[]
}

/** Update one order's status. Throws on error so the caller can revert. */
export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}
