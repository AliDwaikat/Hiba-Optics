import { createClient } from '@supabase/supabase-js'

/**
 * SEPARATE Supabase client for CUSTOMER accounts (public sign-up / login).
 *
 * This is intentionally distinct from the shared admin `supabase` client in
 * ./supabase.ts. It uses its own `storageKey` so customer sessions live in a
 * different localStorage slot and are INVISIBLE to the admin client. Because the
 * admin ProtectedRoute checks the admin client's session (which stays null for
 * customers), a signed-in customer can never reach /admin — no owner-email
 * config or changes to the admin guard are required.
 *
 * The distinct storageKey also avoids the "Multiple GoTrueClient instances"
 * console warning, which supabase-js keys per storageKey.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// createClient throws on an empty URL — fall back to a harmless valid value so
// module load never crashes when env is absent (mirrors ./supabase.ts).
export const supabaseCustomer = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      storageKey: 'hiba-customer-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)
