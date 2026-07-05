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
}

const CUSTOMER_COLUMNS = 'id, name, email, created_at'

/** Every customer profile, newest first. Throws on a real error. */
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(CUSTOMER_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Customer[]
}
