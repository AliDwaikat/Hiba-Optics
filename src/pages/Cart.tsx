import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { formatPrice } from '../lib/format'
import { format } from '../lib/i18n'
import { useCart, type CartItem } from '../lib/cart'
import { useLanguage } from '../lib/language'

// Cart prices are all in shekels (₪); CartItem doesn't carry a currency.
const CURRENCY = 'ILS'

/* ---------- Icons ---------- */
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

/* Small branded placeholder for a missing/broken thumbnail. */
function ThumbPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <span className="font-latin text-sm font-bold text-ink/25" dir="ltr">
        Hiba
      </span>
    </div>
  )
}

/** A cart line's React key: product id + variant id + size (each may be null). */
function lineReactKey(item: CartItem): string {
  return `${item.productId}-${item.variantId ?? ''}-${item.size ?? ''}`
}

/* ---------- Line item ---------- */
function CartLine({ item }: { item: CartItem }) {
  const { updateQty, removeItem } = useCart()
  const { t, localize } = useLanguage()
  const [broken, setBroken] = useState(false)
  const vid = item.variantId ?? null
  const size = item.size ?? null
  // Tracked stock caps the quantity; untracked (null) ⇒ no cap.
  const cap = item.stock ?? null
  const atCap = cap != null && item.quantity >= cap
  const showImage = Boolean(item.image) && !broken
  const name = localize(item, 'name')

  return (
    <div className="flex gap-4 p-4 sm:p-5">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] bg-cream">
        {showImage ? (
          <img
            src={item.image}
            alt={name}
            onError={() => setBroken(true)}
            className="h-full w-full object-contain p-1.5"
          />
        ) : (
          <ThumbPlaceholder />
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            {item.brand_ar && <p className="text-xs text-gray-600">{item.brand_ar}</p>}
            <p className="font-semibold text-ink">{name}</p>
            {item.color && (
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-600">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-gray-300"
                  style={{ backgroundColor: item.color.hex }}
                />
                {localize(item.color, 'name')}
              </span>
            )}
            {item.size && (
              <p className="num mt-1 text-xs text-gray-600">
                {t('cart.size')}: <span dir="ltr">{item.size}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => removeItem(item.productId, vid, size)}
            aria-label={t('cart.remove')}
            className="text-gray-600 transition-colors hover:text-error"
          >
            <TrashIcon />
          </button>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          {/* Quantity stepper */}
          <div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => updateQty(item.productId, vid, size, Math.max(1, item.quantity - 1))}
                disabled={item.quantity <= 1}
                aria-label={t('cart.qtyDec')}
                className="h-8 w-8 rounded-full border border-gray-300 text-lg leading-none text-ink transition-colors hover:border-yellow disabled:opacity-40"
              >
                −
              </button>
              <span className="num w-6 text-center text-ink">{item.quantity}</span>
              <button
                type="button"
                onClick={() => updateQty(item.productId, vid, size, item.quantity + 1)}
                disabled={atCap}
                aria-label={t('cart.qtyInc')}
                className="h-8 w-8 rounded-full border border-gray-300 text-lg leading-none text-ink transition-colors hover:border-yellow disabled:opacity-40"
              >
                +
              </button>
            </div>
            {atCap && (
              <p className="num mt-1.5 text-xs text-gray-600">{format(t('cart.available'), { n: cap })}</p>
            )}
          </div>

          {/* Price / total */}
          <div className="text-end">
            <p className="num text-xs text-gray-600">{formatPrice(item.price, CURRENCY)}</p>
            {item.requiresConsultation ? (
              <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {t('cart.coordinated')}
              </span>
            ) : (
              <p className="num font-bold text-ink">{formatPrice(item.price * item.quantity, CURRENCY)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Group container ---------- */
function ItemGroup({ items }: { items: CartItem[] }) {
  return (
    <RevealGroup className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-[var(--radius-lg)] border border-gray-100 bg-white shadow-card">
      {items.map((item) => (
        <RevealItem key={lineReactKey(item)}>
          <CartLine item={item} />
        </RevealItem>
      ))}
    </RevealGroup>
  )
}

/* ---------- Empty state ---------- */
function EmptyCart() {
  const { t } = useLanguage()
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-gray-300">
        <BagIcon />
      </span>
      <p className="mt-5 text-xl font-bold text-ink">{t('cart.empty')}</p>
      <Link to="/shop" className="btn btn-primary mt-6">
        {t('common.browseShop')}
      </Link>
    </div>
  )
}

export default function Cart() {
  const { t } = useLanguage()
  const { items, itemCount, subtotal } = useCart()

  if (itemCount === 0) {
    return (
      <main className="bg-white">
        <EmptyCart />
      </main>
    )
  }

  const groupA = items.filter((i) => !i.requiresConsultation)
  const groupB = items.filter((i) => i.requiresConsultation)
  const hasReserve = groupB.length > 0
  const onlyReserve = groupA.length === 0
  const reserveCount = groupB.reduce((n, i) => n + i.quantity, 0)

  const ReserveNote = () => (
    <div className="rounded-[var(--radius)] border border-yellow/40 bg-yellow/10 p-3 text-sm text-ink">
      {t('cart.reserveBadge.pre')} <span className="num font-bold">{reserveCount}</span>{' '}
      {t('cart.reserveBadge.post')}
    </div>
  )

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('cart.title')}</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Item list (main / right) */}
          <div className="lg:col-span-2">
            {groupA.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-ink">{t('cart.groupShop')}</h2>
                <ItemGroup items={groupA} />
              </section>
            )}

            {hasReserve && (
              <section className={groupA.length > 0 ? 'mt-10' : ''}>
                <h2 className="text-lg font-bold text-ink">{t('cart.groupReserve')}</h2>
                <p className="mt-1 text-sm text-gray-600">{t('cart.reserveNote')}</p>
                <ItemGroup items={groupB} />
              </section>
            )}
          </div>

          {/* Summary (aside / left) */}
          <aside className="lg:col-span-1">
            <Reveal className="lg:sticky lg:top-24">
              <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink">{t('cart.summary')}</h2>

                {onlyReserve && (
                  <div className="mt-4">
                    <ReserveNote />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-600">{t('cart.subtotal')}</span>
                  <span className="num text-xl font-bold text-ink">{formatPrice(subtotal, CURRENCY)}</span>
                </div>
                <p className="mt-2 text-xs text-gray-600">{t('cart.deliveryNote')}</p>

                {hasReserve && !onlyReserve && (
                  <div className="mt-4">
                    <ReserveNote />
                  </div>
                )}

                <Link to="/checkout" className="btn btn-primary mt-6 w-full">
                  {t('cart.checkout')}
                </Link>
                <Link
                  to="/shop"
                  className="btn mt-3 w-full border border-ink/20 text-ink transition-colors hover:bg-ink/5"
                >
                  {t('cart.continue')}
                </Link>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </main>
  )
}
