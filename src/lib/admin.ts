/**
 * Owner-only admin access control.
 *
 * The admin panel (/admin/*) is restricted to a single OWNER account, identified
 * by email. A valid Supabase session is NOT sufficient — the session's email
 * must match the owner. This keeps customers (who can sign in with the same
 * Supabase auth backend) out of the admin, even if they reach /admin/login.
 *
 * The owner email comes from VITE_ADMIN_EMAIL, falling back to the known owner
 * address so the guard is never accidentally disabled by a missing env var.
 */
export const ADMIN_EMAIL: string = (
  import.meta.env.VITE_ADMIN_EMAIL || 'hibaopticswebsite@gmail.com'
)
  .trim()
  .toLowerCase()

/** True only when `email` is the owner address (case-insensitive). */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}
