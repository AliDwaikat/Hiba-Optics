/**
 * Branded fallback shown when a product has no image (or one fails to load).
 * Shared by the storefront product card and the admin product list so both
 * render the exact same placeholder — never a broken image.
 */
export default function ProductImagePlaceholder({
  textClassName = 'text-2xl',
  light = false,
}: {
  textClassName?: string
  /** Light variant for clean white/neutral tiles (e.g. the storefront card). */
  light?: boolean
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center ${
        light ? 'bg-gray-100' : 'bg-gray-900'
      }`}
    >
      <span
        className={`font-latin ${textClassName} font-bold tracking-tight ${
          light ? 'text-gray-300' : 'text-yellow'
        }`}
        dir="ltr"
      >
        Hiba
      </span>
    </div>
  )
}
