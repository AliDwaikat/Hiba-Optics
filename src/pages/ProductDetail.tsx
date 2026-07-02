import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import { formatPrice } from '../lib/format'
import { useCart, type CartColor } from '../lib/cart'
import {
  fetchBrandById,
  fetchProduct,
  type Product,
  type ProductColor,
} from '../lib/products'

type LoadState =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'notfound' }
  | { state: 'ready'; product: Product; brandName: string }

function Placeholder({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
      <span className="font-latin text-3xl font-bold tracking-tight text-yellow" dir="ltr">
        Hiba
      </span>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
      <div className="aspect-square w-full rounded-xl bg-gray-900" />
      <div className="space-y-4">
        <div className="h-3 w-1/4 rounded bg-gray-900" />
        <div className="h-7 w-3/4 rounded bg-gray-900" />
        <div className="h-4 w-full rounded bg-gray-900" />
        <div className="h-4 w-5/6 rounded bg-gray-900" />
        <div className="h-6 w-1/3 rounded bg-gray-900" />
        <div className="h-11 w-full rounded bg-gray-900" />
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const { addItem } = useCart()

  const [load, setLoad] = useState<LoadState>({ state: 'loading' })
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
    setActiveImage(0)
    setSelectedColor(null)
    setQuantity(1)
    setFeedback(null)
    setImageBroken({})

    fetchProduct(id)
      .then(async (product) => {
        if (!active) return
        if (!product) {
          setLoad({ state: 'notfound' })
          return
        }
        let brandName = ''
        if (product.brand_id) {
          const brand = await fetchBrandById(product.brand_id).catch(() => null)
          if (brand) brandName = brand.name_ar
        }
        if (active) setLoad({ state: 'ready', product, brandName })
      })
      .catch((err: unknown) => {
        if (active) setLoad({ state: 'error', message: err instanceof Error ? err.message : String(err) })
      })

    return () => {
      active = false
    }
  }, [id])

  if (load.state === 'loading') {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <DetailSkeleton />
      </main>
    )
  }

  if (load.state === 'error') {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="py-24 text-center">
          <p className="text-lg" style={{ color: 'var(--color-error)' }}>
            تعذّر تحميل المنتج
          </p>
          <p className="mt-2 text-sm text-gray-300">{load.message}</p>
          <Link to="/shop" className="mt-6 inline-block text-yellow hover:underline">
            العودة إلى المتجر
          </Link>
        </div>
      </main>
    )
  }

  if (load.state === 'notfound') {
    return (
      <main className="min-h-screen bg-black">
        <Header />
        <div className="py-24 text-center">
          <p className="text-xl text-white">المنتج غير موجود</p>
          <Link to="/shop" className="mt-6 inline-block text-yellow hover:underline">
            العودة إلى المتجر
          </Link>
        </div>
      </main>
    )
  }

  const { product, brandName } = load

  const price = Number(product.price)
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null
  const onSale = salePrice != null && salePrice < price
  const effectivePrice = onSale ? (salePrice as number) : price

  const hasColors = product.colors.length > 0
  const canAdd =
    product.in_stock && (!hasColors || selectedColor !== null)

  const images = product.images
  const currentImage = images[activeImage]
  const showCurrent = Boolean(currentImage) && !imageBroken[activeImage]

  function handleAdd() {
    if (!canAdd) return
    const color: CartColor | null = selectedColor
    addItem({
      productId: product.id,
      name_ar: product.name_ar,
      name_en: product.name_en,
      brand_ar: brandName,
      price: effectivePrice,
      image: images[0] ?? '',
      color,
      quantity,
      requiresConsultation: product.requires_consultation,
    })
    setFeedback(
      product.requires_consultation ? 'تمت الإضافة للحجز ✓' : 'تمت الإضافة ✓',
    )
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-900">
            {showCurrent ? (
              <img
                src={currentImage}
                alt={product.name_ar}
                onError={() => setImageBroken((m) => ({ ...m, [activeImage]: true }))}
                className="h-full w-full object-cover"
              />
            ) : (
              <Placeholder className="h-full w-full" />
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border ${
                    i === activeImage ? 'border-yellow' : 'border-gray-900'
                  }`}
                >
                  {imageBroken[i] ? (
                    <Placeholder className="h-full w-full" />
                  ) : (
                    <img
                      src={img}
                      alt=""
                      onError={() => setImageBroken((m) => ({ ...m, [i]: true }))}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="text-right">
          {brandName && <p className="text-sm text-gray-300">{brandName}</p>}
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            {product.name_ar}
          </h1>

          {/* Price */}
          <div className="mt-4">
            {onSale ? (
              <div className="flex items-center justify-start gap-3">
                <span className="num text-2xl font-bold text-yellow">
                  {formatPrice(effectivePrice, product.currency)}
                </span>
                <span className="num text-lg text-gray-300 line-through">
                  {formatPrice(price, product.currency)}
                </span>
              </div>
            ) : (
              <span className="num text-2xl font-bold text-white">
                {formatPrice(price, product.currency)}
              </span>
            )}
          </div>

          {product.description_ar && (
            <p className="mt-4 leading-relaxed text-gray-300">{product.description_ar}</p>
          )}

          {/* Color switcher */}
          {hasColors && (
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">اللون</span>
                <span className="text-sm text-gray-300">
                  {selectedColor ? selectedColor.name_ar : 'اختاري اللون'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const active = selectedColor?.name_ar === color.name_ar
                  return (
                    <button
                      key={color.name_ar}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      aria-label={color.name_ar}
                      title={color.name_ar}
                      className={`h-9 w-9 rounded-full border-2 transition-transform ${
                        active ? 'scale-110 border-yellow' : 'border-gray-900'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity stepper */}
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-white">الكمية</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="إنقاص الكمية"
                className="h-9 w-9 rounded-full border border-gray-900 text-lg text-white transition-colors hover:border-yellow disabled:opacity-40"
              >
                −
              </button>
              <span className="num w-8 text-center text-white">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="زيادة الكمية"
                className="h-9 w-9 rounded-full border border-gray-900 text-lg text-white transition-colors hover:border-yellow"
              >
                +
              </button>
            </div>
          </div>

          {/* Out of stock */}
          {!product.in_stock && (
            <p className="mt-6 text-sm font-medium" style={{ color: 'var(--color-error)' }}>
              غير متوفر
            </p>
          )}

          {/* Consultation notice */}
          {product.requires_consultation && (
            <p className="mt-6 rounded-lg border border-gray-900 bg-gray-900/40 p-3 text-sm leading-relaxed text-gray-300">
              هذا إطار طبي يحتاج فحص نظر وتركيب عدسات — عند الطلب سنتواصل معك لإتمام
              الفحص واختيار العدسات.
            </p>
          )}

          {/* Action button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="mt-4 w-full rounded-full bg-yellow py-3 font-semibold text-ink transition-colors hover:bg-yellow-deep disabled:cursor-not-allowed disabled:opacity-40"
          >
            {product.requires_consultation ? 'احجز الآن' : 'أضف إلى السلة'}
          </button>

          {feedback && (
            <p className="mt-3 text-center text-sm" style={{ color: 'var(--color-success)' }}>
              {feedback}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
