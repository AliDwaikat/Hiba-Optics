import { supabase } from './supabase'

/**
 * Bookings data layer. Fields mirror the Supabase `bookings` columns exactly.
 */

export type BookingService = 'eye_exam' | 'glasses_consult' | 'general'

export interface BookingInput {
  booking_number: string
  name: string
  phone: string
  branch_id: string | null
  service: BookingService
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
  status: string
}

/**
 * Insert a booking and confirm it via the returned row.
 * Throws on error (or if no row is returned) so the caller can let the customer
 * retry without navigating away.
 */
export async function createBooking(input: BookingInput): Promise<BookingInput> {
  const { data, error } = await supabase.from('bookings').insert(input).select().single()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('لم يتم تأكيد الحجز')
  return data as BookingInput
}

/** Booking number in the format HIB-BK-YYYYMMDD-XXXX (Western digits). */
export function generateBookingNumber(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return `HIB-BK-${y}${m}${day}-${suffix}`
}

/** Today's date as YYYY-MM-DD, for the date input's min (no past dates). */
export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
