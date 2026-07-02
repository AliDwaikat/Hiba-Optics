import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { formatPrice } from '../lib/format'
import { useCart, type CartColor } from '../lib/cart'
import { useFavorites } from '../lib/favorites'
import HeartIcon from '../components/HeartIcon'
import {
  CATEGORY_LABELS_AR,
  fetchProduct,
  fetchReviews,
  type ProductColor,
  type ProductWithBrand,
  type Review,
} from '../lib/products'

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
const TRUST = [
  { text: 'منتج أصلي', path: 'M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Zm-2 9 2 2 3-3.5' },
  { text: 'ضمان الجودة', path: 'M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z' },
  { text: 'فحص وتركيب في المحل', path: 'M3 9l1-5h16l1 5M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm5 4h6' },
]

/* Branded placeholder for an empty/broken image (never breaks layout). */
function Placeholder({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-cream ${className}`}>
      <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-yellow/25" />
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[12px] border-yellow/20" />
      <span className="font-latin text-5xl font-bold tracking-tight text-ink/15" dir="ltr">
        Hiba
      </span>
    </div>
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
  const reduce = useReducedMotion()
  const reviewsRef = useRef<HTMLDivElement>(null)

  const [load, setLoad] = useState<LoadState>({ state: 'loading' })
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [imageBroken, setImageBroken] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!id) {
      setLoad({ state: 'notfound' })
      return
    }
    let active = true
    setLoad({ state: 'loading' })
    setReviews([])
    setActiveImage(0)
    setSelectedColor(null)
    setQuantity(1)
    setFeedback(null)
    setImageBroken({})

    fetchProduct(id)
      .then((product) => {
        if (!active) return
        if (!product) {
          setLoad({ state: 'notfound' })
          return
        }
        setLoad({ state: 'ready', product })
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
            تعذّر تحميل المنتج
          </p>
          <p className="mt-2 text-sm text-gray-600">{load.message}</p>
          <Link to="/shop" className="mt-6 inline-block text-ink underline decoration-yellow underline-offset-4">
            العودة إلى المتجر
          </Link>
        </div>
      </main>
    )
  }

  if (load.state === 'notfound') {
    return (
      <main className="bg-white">
        <div className="py-24 text-center">
          <p className="text-xl font-bold text-ink">المنتج غير موجود</p>
          <Link to="/shop" className="mt-6 inline-block text-ink underline decoration-yellow underline-offset-4">
            العودة إلى المتجر
          </Link>
        </div>
      </main>
    )
  }

  const { product } = load
  const favorited = isFavorite(product.id)
  const price = Number(product.price)
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null
  const onSale = salePrice != null && salePrice < price
  const effectivePrice = onSale ? (salePrice as number) : price
  const savePercent = onSale ? Math.round(((price - (salePrice as number)) / price) * 100) : 0

  const images = product.images
  const hasColors = product.colors.length > 0
  const canAdd = product.in_stock && (!hasColors || selectedColor !== null)

  const currentImage = images[activeImage]
  const showCurrent = Boolean(currentImage) && !imageBroken[activeImage]

  function handleAdd() {
    if (!canAdd) return
    const color: CartColor | null = selectedColor
    addItem({
      productId: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      brand_ar: product.brand_name_ar ?? '',
      price: effectivePrice,
      image: images[0] ?? '',
      color,
      quantity,
      requiresConsultation: product.requires_consultation,
    })
    setFeedback(product.requires_consultation ? 'تمت الإضافة للحجز ✓' : 'تمت الإضافة ✓')
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600" aria-label="مسار التنقل">
          <Link to="/" className="transition-colors hover:text-ink">
            الرئيسية
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link to="/shop" className="transition-colors hover:text-ink">
            {CATEGORY_LABELS_AR[product.category]}
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-ink">{product.name_ar}</span>
        </nav>

        <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
          {/* GALLERY — right column in RTL */}
          <Reveal>
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] bg-cream shadow-card">
              {showCurrent ? (
                <img
                  src={currentImage}
                  alt={product.name_ar}
                  onError={() => setImageBroken((m) => ({ ...m, [activeImage]: true }))}
                  className="h-full w-full object-contain p-6"
                />
              ) : (
                <Placeholder className="h-full w-full" />
              )}

              {/* Badges */}
              <div className="absolute start-3 top-3 flex flex-col items-start gap-2">
                {product.featured && (
                  <span className="rounded-full bg-yellow px-3 py-1 text-xs font-bold text-ink">الأكثر مبيعاً</span>
                )}
                {!product.in_stock && (
                  <span className="rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white">غير متوفر</span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    aria-label={`صورة ${i + 1}`}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-cream ring-2 transition ${
                      i === activeImage ? 'ring-yellow' : 'ring-transparent hover:ring-gray-300'
                    }`}
                  >
                    {imageBroken[i] ? (
                      <Placeholder className="h-full w-full" />
                    ) : (
                      <img
                        src={img}
                        alt=""
                        onError={() => setImageBroken((m) => ({ ...m, [i]: true }))}
                        className="h-full w-full object-contain p-1"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </Reveal>

          {/* INFO — left column in RTL */}
          <Reveal delay={0.08}>
            {(product.brand_name_ar || product.name_en) && (
              <p className="text-sm text-gray-600">
                {product.brand_name_ar}
                {product.name_en && (
                  <span className="latin ms-2 text-gray-600">{product.name_en}</span>
                )}
              </p>
            )}
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{product.name_ar}</h1>

            {/* Rating summary */}
            {reviewStats.count > 0 && (
              <button
                type="button"
                onClick={scrollToReviews}
                className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-ink"
              >
                <Stars value={reviewStats.avg} />
                <span className="num">
                  {reviewStats.avg.toFixed(1)} ({reviewStats.count} تقييم)
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
                    وفّر {savePercent}٪
                  </span>
                </>
              ) : (
                <span className="num text-3xl font-bold text-ink">{formatPrice(price, product.currency)}</span>
              )}
            </div>

            {/* Description */}
            {product.description_ar && (
              <p className="mt-5 leading-relaxed text-gray-600">{product.description_ar}</p>
            )}

            {/* Feature bullets */}
            {product.features.length > 0 && (
              <ul className="mt-5 space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink">
                    <CheckIcon />
                    <span>{f.text_ar}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Color switcher */}
            {hasColors && (
              <div className="mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink">اللون</span>
                  <span className="text-gray-600">{selectedColor ? selectedColor.name_ar : 'اختاري اللون'}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const activeSwatch = selectedColor?.name_ar === color.name_ar
                    return (
                      <button
                        key={color.name_ar}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        aria-label={color.name_ar}
                        title={color.name_ar}
                        className={`h-9 w-9 rounded-full border transition-transform ${
                          activeSwatch ? 'scale-110 border-yellow ring-2 ring-yellow' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm text-ink">الكمية</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="إنقاص الكمية"
                  className="h-9 w-9 rounded-full border border-gray-300 text-lg text-ink transition-colors hover:border-yellow disabled:opacity-40"
                >
                  −
                </button>
                <span className="num w-8 text-center text-ink">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="زيادة الكمية"
                  className="h-9 w-9 rounded-full border border-gray-300 text-lg text-ink transition-colors hover:border-yellow"
                >
                  +
                </button>
              </div>
            </div>

            {/* Out of stock note */}
            {!product.in_stock && (
              <p className="mt-6 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
                غير متوفر
              </p>
            )}

            {/* Consultation notice */}
            {product.requires_consultation && (
              <p className="mt-6 rounded-[var(--radius)] border border-gray-300 bg-cream p-3 text-sm leading-relaxed text-gray-600">
                هذا إطار طبي يحتاج فحص نظر وتركيب عدسات — سنتواصل معك لإتمام الفحص واختيار العدسات.
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
                {product.requires_consultation ? 'احجز الآن' : 'أضف إلى السلة'}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-pressed={favorited}
                className="btn btn-secondary shrink-0"
              >
                <HeartIcon filled={favorited} />
                المفضلة
              </button>
            </div>

            {feedback && (
              <p className="mt-3 text-center text-sm font-medium" style={{ color: 'var(--color-success)' }}>
                {feedback}
              </p>
            )}

            {/* Trust row */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-5 text-sm text-gray-600">
              {TRUST.map((t) => (
                <span key={t.text} className="inline-flex items-center gap-2">
                  <TrustIcon path={t.path} />
                  {t.text}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* REVIEWS */}
        <div ref={reviewsRef} className="mt-16 border-t border-gray-100 pt-12 sm:mt-20">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">التقييمات</h2>
            {reviewStats.count > 0 && (
              <span className="inline-flex items-center gap-2 text-sm text-gray-600">
                <Stars value={reviewStats.avg} />
                <span className="num">
                  {reviewStats.avg.toFixed(1)} ({reviewStats.count} تقييم)
                </span>
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="mt-6 text-gray-600">لا توجد تقييمات بعد</p>
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
