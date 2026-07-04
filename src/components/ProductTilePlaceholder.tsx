/**
 * Branded placeholder for no-photo products on the storefront, matching Hiba's
 * DARK product tiles: a near-black background with line-art glasses in a soft
 * light stroke and a yellow "smile" accent. Shared by the product card and the
 * product-detail gallery so both blend with the black image tiles during
 * rollout (no light/dark mismatch). object-fit handled by the parent tile.
 */
export default function ProductTilePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[#000] ${className}`}
    >
      <svg
        viewBox="0 0 56 40"
        className="h-1/2 w-1/2 max-h-28 max-w-[10rem]"
        fill="none"
        aria-hidden="true"
      >
        <g
          stroke="var(--color-cream)"
          strokeOpacity="0.5"
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
