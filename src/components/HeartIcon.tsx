/** Heart glyph — filled (yellow) when favorited, outline otherwise. */
export default function HeartIcon({ filled, className = '' }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" className={`fill-yellow ${className}`} aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10-9.2C.6 8.9 2 5.5 5.2 5.1c1.9-.2 3.5.8 4.4 2.1.2.3.6.3.8 0 .9-1.3 2.5-2.3 4.4-2.1C21.9 5.5 23.4 8.9 22 11.8 19.5 16.4 12 21 12 21Z" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M19.5 5.4c-1.9-1.6-4.6-1-6 .6L12 7.6l-1.5-1.6c-1.4-1.6-4.1-2.2-6-.6-2.2 1.8-2.3 5-.3 7L12 21l7.8-8.8c2-2 1.9-5.2-.3-6.8Z" />
    </svg>
  )
}
