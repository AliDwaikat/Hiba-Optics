import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, RevealGroup, RevealItem } from './Reveal'
import ProductCard from '../ProductCard'
import { useLanguage } from '../../lib/language'
import { fetchBrands, fetchFeaturedProducts, type Brand, type Product } from '../../lib/products'

/**
 * Homepage "نظارات مميزة" section: published products flagged featured = true,
 * ordered by position. Each card derives its image from the current variant
 * structure (variants[].images[0]) via the shared ProductCard, falling back to
 * the branded placeholder — so it renders whenever featured products exist, not
 * only when the legacy images[] field is populated. Hidden only when there are
 * genuinely no featured products, or on a real fetch error.
 */
export default function FeaturedProducts() {
  const { t, localize } = useLanguage()
  const [products, setProducts] = useState<Product[] | null>(null) // null = still loading
  const [brands, setBrands] = useState<Brand[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([fetchFeaturedProducts(8), fetchBrands().catch(() => [] as Brand[])])
      .then(([prods, brs]) => {
        if (!active) return
        setProducts(prods)
        setBrands(brs)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])

  // Render nothing while loading, when there are no featured products, or on a
  // real error — never hide just because a legacy image field is empty.
  if (error || products === null || products.length === 0) return null

  const brandName = (id: string | null): string | undefined => {
    if (!id) return undefined
    const b = brands.find((x) => x.id === id)
    return b ? localize(b, 'name') : undefined
  }

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-20">
        <Reveal>
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">
            {t('featured.eyebrow')}
          </span>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
                {t('featured.heading')}
              </h2>
              <p className="mt-2 text-gray-600">{t('featured.sub')}</p>
            </div>
            <Link
              to="/shop"
              className="text-sm font-medium text-yellow-deep transition-colors hover:text-ink"
            >
              {t('finder.browseAll')}{' '}
              <span aria-hidden="true" className="rtl:inline ltr:hidden">←</span>
              <span aria-hidden="true" className="ltr:inline rtl:hidden">→</span>
            </Link>
          </div>
        </Reveal>

        <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <RevealItem key={p.id}>
              <ProductCard product={p} brandName={brandName(p.brand_id)} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
