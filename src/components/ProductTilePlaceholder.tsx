/**
 * Branded placeholder for no-photo products on the storefront, matching Hiba's
 * clean WHITE product tiles: a white background with line-art glasses in a soft
 * ink stroke and a yellow "smile" accent. Shared by the product card and the
 * product-detail gallery so photoless products blend with the white image tiles
 * (no light/dark mismatch). object-fit handled by the parent tile.
 */
export default function ProductTilePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-white ${className}`}
    >
      <svg
        viewBox="0 0 56 40"
        className="h-1/2 w-1/2 max-h-28 max-w-[10rem]"
        fill="none"
        aria-hidden="true"
      >
        <g
          stroke="var(--color-ink)"
          strokeOpacity="0.45"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* lenses */}
          <rect x="6" y="10" width="16" height="12" rx="4" />
          <rect x="34" y="10" width="16" height="12" rx="4" />
          {/* bridge */}
          <path d="M22 15c2-1.5 4-1.5 6 0" />
          {/* temples */}
          <path d="M6 13 1.5 10" />
          <path d="M50 13 54.5 10" />
        </g>
        {/* yellow smile accent */}
        <path
          d="M18 30c5 4 15 4 20 0"
          stroke="var(--color-yellow)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
