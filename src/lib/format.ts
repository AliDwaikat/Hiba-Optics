/**
 * Formatting helpers. All numeric output uses Western digits (0-9).
 */

const CURRENCY_SYMBOLS: Record<string, string> = {
  ILS: '₪',
  JOD: 'د.أ',
  USD: '$',
  EUR: '€',
}

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}

/**
 * Format a price as "490 ₪" — Western digits, symbol after the amount.
 * Trailing .00 is dropped; genuine fractional prices keep up to 2 decimals.
 */
export function formatPrice(amount: number, currency: string): string {
  const value = Number(amount)
  const formatted = Number.isFinite(value)
    ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : String(amount)
  return `${formatted} ${currencySymbol(currency)}`
}
