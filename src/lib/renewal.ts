/**
 * Lens/exam renewal reminder logic (Level A — in-account only).
 * The renewal window is: due within the next 30 days, OR already passed.
 */
export type RenewalStatus = 'overdue' | 'upcoming' | 'none'

/** Days from today (local midnight) to a YYYY-MM-DD date, or null if invalid. */
export function daysUntilRenewal(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const parts = dateStr.slice(0, 10).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null
  const [y, m, d] = parts
  const target = new Date(y, m - 1, d)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

/**
 * Whether (and how) to surface a renewal reminder:
 *   - 'overdue'  → the date has passed
 *   - 'upcoming' → within the next 30 days
 *   - 'none'     → no date, or more than 30 days out
 */
export function renewalStatus(dateStr: string | null | undefined): RenewalStatus {
  const days = daysUntilRenewal(dateStr)
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days <= 30) return 'upcoming'
  return 'none'
}
