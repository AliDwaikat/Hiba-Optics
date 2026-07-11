import { supabaseCustomer } from './supabaseCustomer'

/**
 * Customer self-service profile data layer. All calls run on the CUSTOMER
 * supabase client so the request carries the customer's JWT — the `profiles`
 * RLS policy (auth.uid() = id) scopes every read/update to that user's own row.
 *
 * Column names mirror the Supabase `profiles` table exactly — do not rename.
 */
export interface CustomerProfile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  /** Renewal reminder — READ ONLY for the customer; only the owner sets these. */
  renewal_date: string | null
  renewal_note: string | null
}

/**
 * The editable fields a customer can change about themselves. Deliberately
 * EXCLUDES renewal_date / renewal_note — only Hiba (owner) sets those.
 */
export interface ProfileUpdate {
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
}

const PROFILE_COLUMNS = 'id, name, email, phone, address, city, renewal_date, renewal_note'

/** The current user's own profile row, or null if it doesn't exist yet. */
export async function fetchMyProfile(userId: string): Promise<CustomerProfile | null> {
  const { data, error } = await supabaseCustomer
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as CustomerProfile) ?? null
}

/**
 * Update the current user's own profile. Chains `.select()` so an RLS failure
 * (e.g. touching another user's row) surfaces as an error rather than a silent
 * no-op. Throws on error so the caller can keep the entered data and show a
 * friendly message.
 */
export async function updateMyProfile(
  userId: string,
  patch: Partial<ProfileUpdate>,
): Promise<void> {
  const { error } = await supabaseCustomer
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select('id')

  if (error) throw new Error(error.message)
}
