import { supabase } from './supabase'
import type { CartColor } from './cart'

/**
 * Orders data layer. Fields mirror the Supabase `orders` columns exactly.
 * Cash-on-delivery only — no online payment.
 */

export type FulfillmentType = 'delivery' | 'pickup'

/** One line of the cart snapshot stored in orders.items (jsonb). */
export interface OrderItemSnapshot {
  productId: string
  /** Chosen variant id (null for legacy / variant-less items). */
  variantId: string | null
  name_ar: string
  quantity: number
  unit_price: number
  /** Selected variant color (name_ar / name_en / hex). */
  color: CartColor | null
  /** The variant's image url (so the order shows the exact color ordered). */
  image: string | null
  requiresConsultation: boolean
}

export interface OrderInput {
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
  status: string
  has_consultation_items: boolean
  notes: string | null
}

/**
 * Insert an order as a guest (anon role). Deliberately does NOT chain
 * `.select()`: anon has INSERT but not SELECT on `orders` (SELECT stays
 * restricted to authenticated/admin), so reading the row back would 401.
 * Success is confirmed by the insert `error` being null; the caller relies on
 * the client-side generated order_number for the success page. Throws the raw
 * Supabase error (with details/code) on failure so the caller can log it, show
 * a friendly message, and keep the cart for retry.
 */
export async function createOrder(input: OrderInput): Promise<void> {
  const { error } = await supabase.from('orders').insert(input)
  if (error) throw error
}

/** Order number in the format HIB-YYYYMMDD-XXXX (Western digits). */
export function generateOrderNumber(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return `HIB-${y}${m}${day}-${suffix}`
}
