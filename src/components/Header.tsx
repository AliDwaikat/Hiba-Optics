import { Link } from 'react-router-dom'
import { BRAND } from '../lib/i18n'
import { useCart } from '../lib/cart'

/** Simple shopping-bag icon. */
function BagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

export default function Header() {
  const { itemCount } = useCart()

  return (
    <header className="border-b border-gray-900 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          to="/"
          className="font-latin text-xl font-bold tracking-tight text-yellow"
          dir="ltr"
        >
          {BRAND.wordmark}
        </Link>

        <Link
          to="/cart"
          aria-label="السلة"
          className="relative inline-flex items-center text-white transition-colors hover:text-yellow"
        >
          <BagIcon />
          {itemCount > 0 && (
            <span className="num absolute -end-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
