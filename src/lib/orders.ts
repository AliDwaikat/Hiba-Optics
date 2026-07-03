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
 * Insert an order and confirm it via the returned row.
 * Throws on error (or if no row is returned) so the caller can keep the cart
 * and let the customer retry.
 */
export async function createOrder(input: OrderInput): Promise<OrderInput> {
  const { data, error } = await supabase.from('orders').insert(input).select().single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('لم يتم تأكيد الطلب')
  return data as OrderInput
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
