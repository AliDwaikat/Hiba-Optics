import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import type { Product } from '../lib/products'
import { formatPrice } from '../lib/format'
import { galleryImages, primaryImage } from '../lib/productImages'
import { useFavorites } from '../lib/favorites'
import { useCart } from '../lib/cart'
import { useLanguage } from '../lib/language'
import HeartIcon from './HeartIcon'
import ProductTilePlaceholder from './ProductTilePlaceholder'

interface ProductCardProps {
  product: Product
  /** Brand name (already localized by the parent from brand_id). */
  brandName?: string
}

export default function ProductCard({ product, brandName }: ProductCardProps) {
  const reduce = useReducedMotion()
  const navigate = useNavigate()
  const { isFavorite, toggle } = useFavorites()
  const { addItem } = useCart()
  const { t, localize } = useLanguage()

  const name = localize(product, 'name')

  const [imageBroken, setImageBroken] = useState(false)
  const [secondBroken, setSecondBroken] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)

  const fav = isFavorite(product.id)

  // Representative variant = first in-stock (or first) — drives quick-add identity.
  // The displayed image uses the SHARED helper so the card and detail agree.
  const variants = product.variants ?? []
  const repVariant = variants.find((v) => v.in_stock) ?? variants[0] ?? null
  // Any colour with polarized lenses → show the card-level Polarized badge.
  const hasPolarizedVariant = variants.some((v) => v.polarized === true)
  const imageUrl = primaryImage(product) ?? undefined
  // A second, distinct image (from the rep variant's gallery) for the hover crossfade.
  const secondUrl = galleryImages(product, repVariant).find((u) => u !== imageUrl)
  const showImage = Boolean(imageUrl) && !imageBroken
  const hasSecond = showImage && Boolean(secondUrl) && !secondBroken

  // Card pricing reflects the REPRESENTATIVE color (default/first in-stock
  // variant): its own price/sale each fall back to the product-level values.
  const price = Number(product.price)
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null
  const cardRegular = repVariant?.price != null ? Number(repVariant.price) : price
  const cardSaleRaw = repVariant?.sale_price != null ? Number(repVariant.sale_price) : salePrice
  const onSale =
    cardSaleRaw != null && Number.isFinite(cardSaleRaw) && cardSaleRaw > 0 && cardSaleRaw < cardRegular
  const effectivePrice = onSale ? (cardSaleRaw as number) : cardRegular

  // Motion only when hovered AND the user hasn't asked to reduce motion.
  const animateHover = hovered && !reduce

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      brand_ar: brandName ?? '',
      price: effectivePrice,
      image: galleryImages(product, repVariant)[0] ?? imageUrl ?? '',
      color: repVariant
        ? { name_ar: repVariant.name_ar, name_en: repVariant.name_en, hex: repVariant.hex }
        : null,
      variantId: repVariant?.id ?? null,
      quantity: 1,
      requiresConsultation: false,
    })
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  function handleReserve(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/product/${product.id}`)
  }

  // Quick-add reveal: a bar anchored to the BOTTOM edge of the image so it never
  // covers the centred frame. It slides up + fades in (~0.25s). Always visible on
  // touch (hover: none); hover-revealed on pointer devices (slides fully below the
  // image when hidden). Reduced motion keeps it in place, no transition.
  const revealClass =
    'absolute inset-x-0 bottom-0 z-10 px-2 pb-2 pt-6 ' +
    'bg-gradient-to-t from-white via-[rgba(255,255,255,0.9)] to-transparent ' +
    'transition-all duration-[250ms] ease-out ' +
    'translate-y-0 opacity-100 ' +
    '[@media(hover:hover)]:translate-y-full [@media(hover:hover)]:opacity-0 ' +
    '[@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 ' +
    'motion-reduce:transition-none motion-reduce:!translate-y-0 motion-reduce:!opacity-100'

  const quickBtnClass =
    'flex w-full items-center justify-center gap-1 rounded-full bg-yellow px-3 py-2 text-xs font-bold text-ink shadow-sm transition-colors hover:bg-yellow-deep'

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <motion.div
        className="rounded-xl"
        animate={{ y: animateHover ? -3 : 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        style={{
          boxShadow: animateHover ? '0 14px 30px rgba(0,0,0,0.14)' : '0 0 0 rgba(0,0,0,0)',
        }}
      >
        <div
          className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-100 bg-white ${
            product.in_stock ? '' : 'opacity-60'
          }`}
        >
          {showImage ? (
            <>
              {/* Eyewear is wide/short — object-contain shows the whole frame,
                  centered on a clean tile (never cropped). */}
              <motion.img
                src={imageUrl}
                alt={name}
                loading="lazy"
                onError={() => setImageBroken(true)}
                animate={{ scale: animateHover ? 1.04 : 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3"
              />
              {hasSecond && (
                <motion.img
                  src={secondUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  initial={false}
                  onError={() => setSecondBroken(true)}
                  animate={{ scale: animateHover ? 1.04 : 1, opacity: animateHover ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3"
                />
              )}
            </>
          ) : (
            <ProductTilePlaceholder />
          )}

          {/* Favorite toggle — ink outline heart on a subtle light chip so it
              stays visible on the white image tile; top-start corner (dir-aware).
              Favorited fills brand yellow. Does not open the link. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggle(product.id)
            }}
            aria-label={t('header.favorites')}
            aria-pressed={fav}
            className="absolute start-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink ring-1 ring-gray-100 backdrop-blur-sm transition-colors hover:bg-white"
          >
            <HeartIcon filled={fav} />
          </button>

          {/* Top-end badge stack (dir-aware): consultation + Polarized. */}
          {(product.requires_consultation || hasPolarizedVariant) && (
            <div className="absolute end-2 top-2 z-10 flex flex-col items-end gap-1">
              {product.requires_consultation && (
                <span className="rounded-full bg-yellow px-2 py-1 text-xs font-medium text-ink">
                  {t('card.consultation')}
                </span>
              )}
              {hasPolarizedVariant && (
                <span
                  dir="ltr"
                  className="rounded-full bg-white/85 px-2 py-1 text-xs font-semibold text-ink ring-1 ring-gray-100 backdrop-blur-sm"
                >
                  Polarized
                </span>
              )}
            </div>
          )}

          {!product.in_stock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60">
              <span className="rounded-full bg-ink px-4 py-1 text-sm font-medium text-white">
                {t('card.outOfStock')}
              </span>
            </div>
          )}

          {/* Quick-add reveal */}
          {product.requires_consultation ? (
            <div className={revealClass}>
              <button type="button" onClick={handleReserve} className={quickBtnClass}>
                {t('card.reserve')}
              </button>
            </div>
          ) : product.in_stock ? (
            <div className={revealClass}>
              <button type="button" onClick={handleQuickAdd} className={quickBtnClass}>
                {added ? t('card.added') : t('card.add')}
              </button>
            </div>
          ) : null}
        </div>

        {/* Card body — comfortable inline padding (~16px) so text never touches
            the edges; brand → name → price get a little vertical rhythm. */}
        <div className="px-4 pb-4 pt-3 text-start">
          {brandName && <p className="truncate text-xs text-gray-600">{brandName}</p>}
          {/* Name: up to 2 lines with ellipsis, fixed min-height so 1- and
              2-line cards stay aligned across the grid. */}
          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-ink sm:min-h-[3rem] sm:text-base sm:leading-6">
            {name}
          </h3>

          {onSale ? (
            <div className="mt-2 flex flex-wrap items-baseline justify-start gap-x-2 gap-y-0.5">
              <span className="num font-semibold text-ink">
                {formatPrice(cardSaleRaw as number, product.currency)}
              </span>
              <span className="num text-sm text-gray-600 line-through">
                {formatPrice(cardRegular, product.currency)}
              </span>
            </div>
          ) : (
            <div className="mt-2 flex items-baseline">
              <span className="num font-semibold text-ink">
                {formatPrice(cardRegular, product.currency)}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
