import { supabase } from '../supabase'
import type { BookingService } from '../bookings'

/**
 * Admin data layer for bookings. Reads every booking (newest first) and updates
 * status. Column names mirror the Supabase `bookings` table exactly — do not
 * rename.
 */

export type BookingStatus = 'new' | 'confirmed' | 'done' | 'cancelled'

export interface AdminBooking {
  id: string
  booking_number: string
  name: string
  phone: string
  branch_id: string | null
  service: BookingService
  preferred_date: string | null
  preferred_time: string | null
  notes: string | null
  status: BookingStatus
  created_at: string
}

/** Minimal branch shape for resolving branch names. */
export interface BookingBranch {
  id: string
  name_ar: string
}

const BOOKING_COLUMNS =
  'id, booking_number, name, phone, branch_id, service, preferred_date, ' +
  'preferred_time, notes, status, created_at'

/** Every booking, newest first. */
export async function fetchAdminBookings(): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminBooking[]
}

/** All branches (id + Arabic name) — resolves booking branch names. */
export async function fetchBookingBranches(): Promise<BookingBranch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name_ar')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BookingBranch[]
}

/** Update one booking's status. Throws on error so the caller can revert. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}
