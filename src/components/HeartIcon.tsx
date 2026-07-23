/**
 * Heart glyph — one clean path for both states so toggling never shifts layout
 * or clips an edge.
 *  - favorited: filled + stroked in brand yellow (matching stroke keeps edges smooth)
 *  - default:   outline in currentColor (ink on the light chip, so it stays visible on white)
 */
export default function HeartIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  const yellow = 'var(--color-yellow)'
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? yellow : 'none'}
      stroke={filled ? yellow : 'currentColor'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}
