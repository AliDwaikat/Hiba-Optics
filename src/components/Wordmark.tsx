import { BRAND } from '../lib/i18n'

/**
 * Placeholder wordmark for Hiba Optics.
 * Renders the Latin brand name in yellow — to be replaced by the real logo later.
 */
export default function Wordmark() {
  return (
    <span
      className="font-latin font-bold tracking-tight text-yellow"
      style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
      dir="ltr"
    >
      {BRAND.wordmark}
    </span>
  )
}
