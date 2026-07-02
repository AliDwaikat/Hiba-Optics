import { createClient } from '@supabase/supabase-js'

/**
 * Single shared Supabase client for Hiba Optics.
 * Credentials come from Vite env vars (see .env.local). No tables or schema
 * are wired up yet — this only establishes the connection.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const missingEnv: string[] = []
if (!supabaseUrl) {
  missingEnv.push('VITE_SUPABASE_URL')
  console.error(
    '[supabase] Missing environment variable VITE_SUPABASE_URL — set it in .env.local.',
  )
}
if (!supabaseAnonKey) {
  missingEnv.push('VITE_SUPABASE_ANON_KEY')
  console.error(
    '[supabase] Missing environment variable VITE_SUPABASE_ANON_KEY — set it in .env.local.',
  )
}

// createClient throws on an empty URL. When config is absent we pass a harmless
// valid fallback so module load never crashes the app; checkConnection() below
// reports the misconfiguration instead (it short-circuits before any network call).
export const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'missing-anon-key',
)

export type ConnectionResult = { ok: true } | { ok: false; message: string }

/**
 * Lightweight connection check — temporary diagnostic.
 * Treats missing env vars as a config error, otherwise calls auth.getSession()
 * (works with no tables or auth configured yet).
 */
export async function checkConnection(): Promise<ConnectionResult> {
  if (missingEnv.length > 0) {
    return { ok: false, message: `Missing ${missingEnv.join(' and ')}` }
  }
  try {
    const { error } = await supabase.auth.getSession()
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) }
  }
}
