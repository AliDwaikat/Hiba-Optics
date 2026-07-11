import { supabase } from '../supabase'

/**
 * Admin data layer for customers — VIEW ONLY.
 *
 * Reads the public `profiles` table (populated when a customer signs up).
 * We deliberately do NOT touch auth.users: it is protected and requires the
 * service role. `profiles` is RLS-restricted to authenticated reads, and the
 * admin is authenticated as the owner, so this query succeeds for the owner
 * and returns nothing for anonymous visitors.
 *
 * Column names mirror the Supabase `profiles` table exactly — do not rename.
 */
export interface Customer {
  id: string
  name: string | null
  email: string | null
  created_at: string
  /** Renewal reminder (lens/exam) — set by the owner (Hiba) only. */
  renewal_date: string | null
  renewal_note: string | null
}

const CUSTOMER_COLUMNS = 'id, name, email, created_at, renewal_date, renewal_note'

/** Every customer profile, newest first. Throws on a real error. */
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(CUSTOMER_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Customer[]
}

/** What the owner edits for a customer's renewal reminder. */
export interface RenewalUpdate {
  renewal_date: string | null
  renewal_note: string | null
}

/**
 * Set/clear a customer's renewal reminder (owner only). Runs on the admin
 * `supabase` client — the owner is authenticated there, and the owner-update
 * RLS policy lets Hiba update any profile. Chains `.select()` so an RLS failure
 * surfaces as an error instead of a silent no-op.
 */
export async function updateCustomerRenewal(
  id: string,
  patch: RenewalUpdate,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('id')

  if (error) throw new Error(error.message)
}
