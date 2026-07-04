import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { formatPrice } from '../lib/format'
import { useCart, type CartColor } from '../lib/cart'
import { useFavorites } from '../lib/favorites'
import { useLanguage } from '../lib/language'
import { CATEGORY_LABEL_KEY, format, type UIKey } from '../lib/i18n'
import HeartIcon from '../components/HeartIcon'
import ProductTilePlaceholder from '../components/ProductTilePlaceholder'
import {
  fetchProduct,
  fetchReviews,
  type ProductVariant,
  type ProductWithBrand,
  type Review,
} from '../lib/products'
import { galleryImages } from '../lib/productImages'

/* ---------- Icons ---------- */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" className={filled ? 'fill-yellow' : 'fill-gray-300'} aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  )
}
function Stars({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[0, 1, 2, 3, 4].map((i) => (
        <StarIcon key={i} filled={i < filled} />
      ))}
    </span>
  )
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-yellow-deep" aria-hidden="true">
      <path d="m20 6-11 11L4 12" />
    </svg>
  )
}
function TrustIcon({ path }: { path: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-yellow-deep" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}
const TRUST: { key: UIKey; path: string }[] = [
  { key: 'pd.trust.authentic', path: 'M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Zm-2 9 2 2 3-3.5' },
  { key: 'pd.trust.quality', path: 'M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z' },
  { key: 'pd.trust.fitting', path: 'M3 9l1-5h16l1 5M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm5 4h6' },
]

/* True only on hover-capable, fine-pointer devices (desktop) — where the
   hover magnifier makes sense; touch devices use the tap-to-open lightbox. */
function useCanHover() {
  const [can, setCan] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCan(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return can
}

function ChevIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

/* Full-screen lightbox: swipe / arrows to navigate, double-tap (or the zoom
   button) to magnify, Esc to close. Used on touch and on click. */
function Lightbox({
  images,
  index,
  alt,
  reduce,
  onClose,
  onIndex,
}: {
  images: string[]
  index: number
  alt: string
  reduce: boolean
  onClose: () => void
  onIndex: (i: number) => void
}) {
  const { t, dir } = useLanguage()
  const [zoom, setZoom] = useState(false)
  const touchX = useRef<number | null>(null)
  const lastTap = useRef(0)
  const count = images.length
  const clamp = (i: number) => ((i % count) + count) % count
  const rtl = dir === 'rtl'
  // Chevron directions follow reading order (start/end), not fixed physical sides.
  const startChevron = rtl ? 'right' : 'left'
  const endChevron = rtl ? 'left' : 'right'

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  useEffect(() => setZoom(false), [index])
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      // ArrowRight/Left move by visual direction: in RTL they are mirrored.
      else if (e.key === 'ArrowLeft') onIndex(clamp(index + (rtl ? 1 : -1)))
      else if (e.key === 'ArrowRight') onIndex(clamp(index + (rtl ? -1 : 1)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count, rtl])

  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    const now = Date.now()
    const isDouble = now - lastTap.current < 300
    lastTap.current = now
    if (isDouble) {
      setZoom((z) => !z)
      touchX.current = null
      return
    }
    const startX = touchX.current
    touchX.current = null
    if (zoom || startX == null || count <= 1) return
    const dx = (e.changedTouches[0]?.clientX ?? startX) - startX
    if (Math.abs(dx) < 40) return
    onIndex(clamp(dx < 0 ? index + 1 : index - 1)) // RTL: swipe left → next
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('pd.lightbox.aria')}
      style={{ backgroundColor: '#000000' }}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('header.close')}
        className="absolute end-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div
        className="relative flex h-full w-full items-center justify-center p-6 sm:p-12"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[index]}
          alt={alt}
          onDoubleClick={() => setZoom((z) => !z)}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: zoom ? 'scale(2.5)' : 'scale(1)',
            transition: reduce ? 'none' : 'transform 0.2s ease-out',
            cursor: zoom ? 'zoom-out' : 'zoom-in',
          }}
        />

        {count > 1 && (
          <>
            {/* Previous sits at the reading-start edge; next at the reading-end edge. */}
            <button
              type="button"
              onClick={() => onIndex(clamp(index - 1))}
              aria-label={t('pd.gallery.prev')}
              className="absolute start-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            >
              <ChevIcon dir={startChevron} />
            </button>
            <button
              type="button"
              onClick={() => onIndex(clamp(index + 1))}
              aria-label={t('pd.gallery.next')}
              className="absolute end-2 top-1/2 z-10 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
            >
              <ChevIcon dir={endChevron} />
            </button>
            <span className="num absolute bottom-4 start-1/2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white" dir="ltr">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

/* Product image gallery: arrows + keyboard + swipe + hover magnifier (desktop)
   + tap lightbox (touch). Remounts per variant (keyed) so it resets to the
   variant's first image. */
function Gallery({
  images,
  alt,
  overlay,
}: {
  images: string[]
  alt: string
  overlay?: ReactNode
}) {
  const reduce = useReducedMotion()
  const canHover = useCanHover()
  const { t, dir } = useLanguage()
  const [index, setIndex] = useState(0)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const [hovering, setHovering] = useState(false)
  const [origin, setOrigin] = useState('50% 50%')
  const [lightbox, setLightbox] = useState(false)
  const touchX = useRef<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const count = images.length
  const clamp = (i: number) => (count > 0 ? ((i % count) + count) % count : 0)
  const src = images[index]
  const showImage = Boolean(src) && !broken[src]
  const zoomable = showImage
  const magnify = zoomable && canHover && !reduce && hovering
  const rtl = dir === 'rtl'
  // Chevrons follow reading order (start/end), not fixed physical sides.
  const startChevron = rtl ? 'right' : 'left'
  const endChevron = rtl ? 'left' : 'right'

  function onKeyDown(e: React.KeyboardEvent) {
    if (count <= 1) return
    // Arrow keys move by visual direction (mirrored in RTL).
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setIndex((i) => clamp(i + (rtl ? 1 : -1)))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setIndex((i) => clamp(i + (rtl ? -1 : 1)))
    }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!zoomable || !canHover || reduce) return
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    setOrigin(`${x}% ${y}%`)
  }
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0]?.clientX ?? null
  }
  function onTouchEnd(e: React.TouchEvent) {
    const startX = touchX.current
    touchX.current = null
    if (startX == null || count <= 1) return
    const dx = (e.changedTouches[0]?.clientX ?? startX) - startX
    if (Math.abs(dx) < 40) return
    setIndex((i) => clamp(dx < 0 ? i + 1 : i - 1)) // RTL: swipe left → next
  }

  const arrowBtn =
    'absolute top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep'

  return (
    <>
      <div
        ref={stageRef}
        role="group"
        aria-label={t('pd.gallery.aria')}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false)
          setOrigin('50% 50%')
        }}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => zoomable && setLightbox(true)}
        className={`group relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[#000] shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep ${
          zoomable ? 'cursor-zoom-in' : ''
        }`}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setBroken((m) => ({ ...m, [src]: true }))}
            className="h-full w-full select-none object-contain p-4"
            style={{
              transform: magnify ? 'scale(2.3)' : 'scale(1)',
              transformOrigin: origin,
              transition: reduce ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        ) : (
          <ProductTilePlaceholder className="h-full w-full" />
        )}

        {overlay}

        {count > 1 && (
          <>
            {/* Previous at the reading-start edge, next at the reading-end edge. */}
            <button
              type="button"
              aria-label={t('pd.gallery.prev')}
              onClick={(e) => {
                e.stopPropagation()
                setIndex((i) => clamp(i - 1))
              }}
              className={`${arrowBtn} start-2`}
            >
              <ChevIcon dir={startChevron} />
            </button>
            <button
              type="button"
              aria-label={t('pd.gallery.next')}
              onClick={(e) => {
                e.stopPropagation()
                setIndex((i) => clamp(i + 1))
              }}
              className={`${arrowBtn} end-2`}
            >
              <ChevIcon dir={endChevron} />
            </button>
          </>
        )}

        {zoomable && canHover && !reduce && (
          <span className="pointer-events-none absolute bottom-3 end-3 z-10 rounded-full bg-ink/60 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {t('pd.gallery.magnifyHint')}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={format(t('pd.gallery.thumb'), { n: i + 1 })}
              aria-current={i === index}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#000] ring-2 transition focus-visible:outline-none focus-visible:ring-yellow-deep ${
                i === index ? 'ring-yellow' : 'ring-transparent hover:ring-gray-300'
              }`}
            >
              {broken[img] ? (
                <ProductTilePlaceholder className="h-full w-full" />
              ) : (
                <img
                  src={img}
                  alt=""
                  onError={() => setBroken((m) => ({ ...m, [img]: true }))}
                  className="h-full w-full object-contain p-1"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightbox && zoomable && (
        <Lightbox
          images={images}
          index={index}
          alt={alt}
          reduce={!!reduce}
          onClose={() => setLightbox(false)}
          onIndex={(i) => setIndex(i)}
        />
      )}
    </>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-8">
      <div className="h-3 w-64 rounded bg-gray-100" />
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="aspect-square w-full rounded-[var(--radius-lg)] bg-gray-100" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-gray-100" />
          <div className="h-8 w-3/4 rounded bg-gray-100" />
          <div className="h-6 w-1/3 rounded bg-gray-100" />
          <div className="h-4 w-full rounded bg-gray-100" />
          <div className="h-4 w-5/6 rounded bg-gray-100" />
          <div className="h-12 w-full rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

type LoadState =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'notfound' }
  | { state: 'ready'; product: ProductWithBrand }

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { t, localize } = useLanguage()
  const reduce = useReducedMotion()
  const reviewsRef = useRef<HTMLDivElement>(null)

  const [load, setLoad] = useState<LoadState>({ state: 'loading' })
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoad({ state: 'notfound' })
      return
    }
    let active = true
    setLoad({ state: 'loading' })
    setReviews([])
    setSelectedVariantId(null)
    setQuantity(1)
    setFeedback(null)

    fetchProduct(id)
      .then((product) => {
        if (!active) return
        if (!product) {
          setLoad({ state: 'notfound' })
          return
        }
        setLoad({ state: 'ready', product })
        // Default-select the first in-stock variant (or the first variant).
        const vs = product.variants
        const initial = vs.find((v) => v.in_stock) ?? vs[0]
        setSelectedVariantId(initial ? initial.id : null)
        // Reviews are non-critical — a failure must not break the page.
        fetchReviews(id)
          .then((r) => active && setReviews(r))
          .catch(() => active && setReviews([]))
      })
      .catch((err: unknown) => {
        if (active) setLoad({ state: 'error', message: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      active = false
    }
  }, [id])

  const reviewStats = useMemo(() => {
    if (reviews.length === 0) return { count: 0, avg: 0 }
    const sum = reviews.reduce((s, r) => s + Number(r.rating), 0)
    return { count: reviews.length, avg: sum / reviews.length }
  }, [reviews])

  function scrollToReviews() {
    reviewsRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  if (load.state === 'loading') {
    return (
      <main className="bg-white">
        <DetailSkeleton />
      </main>
    )
  }

  if (load.state === 'error') {
    return (
      <main className="bg-white">
        <div className="py-24 text-center">
          <p className="text-lg" style={{ color: 'var(--color-error)' }}>
            {t('pd.error')}
          </p>
          <p className="mt-2 text-sm text-gray-600">{load.message}</p>
          <Link to="/shop" className="mt-6 inline-block text-ink underline decoration-yellow underline-offset-4">
            {t('pd.backToShop')}
          </Link>
        </div>
      </main>
    )
  }

  if (load.state === 'notfound') {
    return (
      <main className="bg-white">
        <div className="py-24 text-center">
          <p className="text-xl font-bold text-ink">{t('pd.notfound')}</p>
          <Link to="/shop" className="mt-6 inline-block text-ink underline decoration-yellow underline-offset-4">
            {t('pd.backToShop')}
          </Link>
        </div>
      </main>
    )
  }

  const { product } = load
  const favorited = isFavorite(product.id)
  // Localized DB content (English when lang='en', Arabic fallback).
  const name = localize(product, 'name')
  const description = localize(product, 'description')
  const brandName =
    localize({ name_ar: product.brand_name_ar, name_en: product.brand_name_en }, 'name')
  const price = Number(product.price)
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null
  const onSale = salePrice != null && salePrice < price
  const effectivePrice = onSale ? (salePrice as number) : price
  const savePercent = onSale ? Math.round(((price - (salePrice as number)) / price) * 100) : 0

  // Variants are the source of truth. Degrade gracefully to one synthetic
  // default when the array is empty (shouldn't happen post-migration).
  const hasVariants = product.variants.length > 0
  const variants: ProductVariant[] = hasVariants
    ? product.variants
    : [
        {
          id: '__default__',
          name_ar: product.name_ar,
          name_en: product.name_en,
          hex: '#d9d9d9',
          images: [],
          in_stock: product.in_stock,
        },
      ]
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0]

  // Gallery for the selected variant, with graceful fallback (selected variant's
  // images → first variant that has images → flat images[] → placeholder). Uses
  // the SAME shared helper as the product card so they never disagree.
  const images = galleryImages(product, selectedVariant)
  const allOutOfStock = variants.every((v) => !v.in_stock)
  const canAdd = selectedVariant.in_stock

  function selectVariant(v: ProductVariant) {
    setSelectedVariantId(v.id)
  }

  function handleAdd() {
    if (!canAdd) return
    const color: CartColor | null = hasVariants
      ? {
          name_ar: selectedVariant.name_ar,
          name_en: selectedVariant.name_en,
          hex: selectedVariant.hex,
        }
      : null
    addItem({
      productId: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      brand_ar: product.brand_name_ar ?? '',
      price: effectivePrice,
      image: images[0] ?? '',
      color,
      variantId: hasVariants ? selectedVariant.id : null,
      quantity,
      requiresConsultation: product.requires_consultation,
    })
    setFeedback(product.requires_consultation ? t('pd.addedReserve') : t('pd.added'))
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600" aria-label={t('pd.breadcrumb.aria')}>
          <Link to="/" className="transition-colors hover:text-ink">
            {t('pd.breadcrumb.home')}
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link to="/shop" className="transition-colors hover:text-ink">
            {t(CATEGORY_LABEL_KEY[product.category])}
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-ink">{name}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          {/* GALLERY — right column in RTL. Keyed by variant so it resets to
              the variant's first image when the color changes. */}
          <Reveal>
            <Gallery
              key={selectedVariant.id}
              images={images}
              alt={name}
              overlay={
                <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-col items-start gap-2">
                  {product.featured && (
                    <span className="rounded-full bg-yellow px-3 py-1 text-xs font-bold text-ink">{t('pd.featured')}</span>
                  )}
                  {allOutOfStock && (
                    <span className="rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">{t('pd.outOfStock')}</span>
                  )}
                </div>
              }
            />
          </Reveal>

          {/* INFO — left column in RTL */}
          <Reveal delay={0.08}>
            {(brandName || (product.name_en && product.name_en !== name)) && (
              <p className="text-sm text-gray-600">
                {brandName}
                {product.name_en && product.name_en !== name && (
                  <span className="latin ms-2 text-gray-600">{product.name_en}</span>
                )}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{name}</h1>

            {/* Rating summary */}
            {reviewStats.count > 0 && (
              <button
                type="button"
                onClick={scrollToReviews}
                className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-ink"
              >
                <Stars value={reviewStats.avg} />
                <span className="num">
                  {reviewStats.avg.toFixed(1)} ({format(t('pd.reviewsCount'), { n: reviewStats.count })})
                </span>
              </button>
            )}

            {/* Price */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {onSale ? (
                <>
                  <span className="num text-3xl font-bold text-ink">{formatPrice(effectivePrice, product.currency)}</span>
                  <span className="num text-lg text-gray-600 line-through">{formatPrice(price, product.currency)}</span>
                  <span className="num rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    {format(t('pd.save'), { x: savePercent })}
                  </span>
                </>
              ) : (
                <span className="num text-3xl font-bold text-ink">{formatPrice(price, product.currency)}</span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="mt-5 leading-relaxed text-gray-600">{description}</p>
            )}

            {/* Feature bullets */}
            {product.features.length > 0 && (
              <ul className="mt-5 space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <CheckIcon />
                    <span>{localize(f, 'text')}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Color / variant switcher */}
            {hasVariants && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink">{t('pd.color')}</span>
                  <span className="text-gray-600">{localize(selectedVariant, 'name')}</span>
                  {!selectedVariant.in_stock && (
                    <span className="text-xs" style={{ color: 'var(--color-error)' }}>
                      {t('pd.outOfStockParen')}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const activeSwatch = selectedVariant.id === v.id
                    const vName = localize(v, 'name')
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => selectVariant(v)}
                        aria-label={vName}
                        aria-pressed={activeSwatch}
                        title={v.in_stock ? vName : `${vName} — ${t('pd.outOfStock')}`}
                        className={`relative h-9 w-9 rounded-full border transition-transform ${
                          activeSwatch ? 'scale-110 border-yellow ring-2 ring-yellow' : 'border-gray-300'
                        } ${v.in_stock ? '' : 'opacity-45'}`}
                        style={{ backgroundColor: v.hex }}
                      >
                        {!v.in_stock && (
                          <span
                            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-bold text-ink"
                            aria-hidden="true"
                          >
                            ✕
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm text-ink">{t('pd.qty')}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label={t('pd.qty.dec')}
                  className="h-9 w-9 rounded-full border border-gray-300 text-lg text-ink transition-colors hover:border-yellow disabled:opacity-40"
                >
                  −
                </button>
                <span className="num w-8 text-center text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label={t('pd.qty.inc')}
                  className="h-9 w-9 rounded-full border border-gray-300 text-lg text-ink transition-colors hover:border-yellow"
                >
                  +
                </button>
              </div>
            </div>

            {/* Out of stock note — all colors vs the selected color */}
            {allOutOfStock ? (
              <p className="mt-6 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                {t('pd.outOfStock')}
              </p>
            ) : (
              !selectedVariant.in_stock && (
                <p className="mt-6 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                  {t('pd.outOfStockColor')}
                </p>
              )
            )}

            {/* Consultation notice */}
            {product.requires_consultation && (
              <p className="mt-6 rounded-[var(--radius)] border border-gray-300 bg-cream p-3 text-sm leading-relaxed text-gray-600">
                {t('pd.consultation')}
              </p>
            )}

            {/* Action button + favorites toggle */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                className="btn btn-primary flex-1"
              >
                {product.requires_consultation ? t('pd.reserve') : t('pd.addToCart')}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-pressed={favorited}
                className="btn btn-secondary shrink-0"
              >
                <HeartIcon filled={favorited} />
                {t('header.favorites')}
              </button>
            </div>

            {feedback && (
              <p className="mt-3 text-center text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {feedback}
              </p>
            )}

            {/* Trust row */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
              {TRUST.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-2">
                  <TrustIcon path={item.path} />
                  {t(item.key)}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* REVIEWS */}
        <div ref={reviewsRef} className="mt-16 border-t border-gray-100 pt-12 sm:mt-20">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{t('pd.reviews.heading')}</h2>
            {reviewStats.count > 0 && (
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Stars value={reviewStats.avg} />
                <span className="num">
                  {reviewStats.avg.toFixed(1)} ({format(t('pd.reviewsCount'), { n: reviewStats.count })})
                </span>
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="mt-6 text-gray-600">{t('pd.reviews.none')}</p>
          ) : (
            <RevealGroup className="mt-8 grid gap-4 sm:grid-cols-2">
              {reviews.map((r) => (
                <RevealItem key={r.id}>
                  <div className="h-full rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{r.author_name}</span>
                      <Stars value={Number(r.rating)} />
                    </div>
                    {r.body && <p className="mt-3 leading-relaxed text-gray-600">{r.body}</p>}
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </main>
  )
}
