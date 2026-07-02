import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/products'
import { formatPrice } from '../lib/format'

interface ProductCardProps {
  product: Product
  /** Arabic brand name, resolved by the parent from brand_id. */
  brandName?: string
}

/** Neutral placeholder shown when a product has no image (or it fails to load). */
function ImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-900">
      <span className="font-latin text-2xl font-bold tracking-tight text-gold" dir="ltr">
        Hiba
      </span>
    </div>
  )
}

export default function ProductCard({ product, brandName }: ProductCardProps) {
  const [imageBroken, setImageBroken] = useState(false)

  const imageUrl = product.images[0]
  const showImage = Boolean(imageUrl) && !imageBroken

  const price = Number(product.price)
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null
  const onSale = salePrice != null && salePrice < price

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div
        className={`relative aspect-square w-full overflow-hidden rounded-xl bg-gray-900 ${
          product.in_stock ? '' : 'opacity-60'
        }`}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt={product.name_ar}
            loading="lazy"
            onError={() => setImageBroken(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {product.requires_consultation && (
          <span className="absolute start-2 top-2 rounded-full border border-gold bg-black/70 px-2 py-1 text-xs font-medium text-gold">
            بحاجة لفحص نظر
          </span>
        )}

        {!product.in_stock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-black/80 px-4 py-1 text-sm font-medium text-white">
              غير متوفر
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 text-right">
        {brandName && <p className="text-xs text-gray-500">{brandName}</p>}
        <h3 className="mt-0.5 text-sm text-white sm:text-base">{product.name_ar}</h3>

        {onSale ? (
          <div className="mt-1 flex items-center justify-start gap-2">
            <span className="num font-semibold text-gold">
              {formatPrice(salePrice as number, product.currency)}
            </span>
            <span className="num text-sm text-gray-500 line-through">
              {formatPrice(price, product.currency)}
            </span>
          </div>
        ) : (
          <div className="mt-1">
            <span className="num font-semibold text-white">
              {formatPrice(price, product.currency)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
