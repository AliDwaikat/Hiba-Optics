import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import HeartIcon from '../components/HeartIcon'
import { useFavorites } from '../lib/favorites'
import { useLanguage } from '../lib/language'
import { format } from '../lib/i18n'
import { fetchProductsByIds, type Product } from '../lib/products'

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-gray-100" />
      <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gray-100" />
    </div>
  )
}

export default function Favorites() {
  const { t } = useLanguage()
  const { favorites, count } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch the products for the favorites present at mount. The visible list is
  // then derived from the LIVE favorites, so un-hearting removes items instantly
  // without a refetch. (favorites captured once on purpose — no dep on it here.)
  useEffect(() => {
    let active = true
    const ids = favorites
    if (ids.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    fetchProductsByIds(ids)
      .then((data) => {
        if (!active) return
        setProducts(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Newest favorites first; skip any that no longer exist / are unpublished.
  const display = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    return [...favorites]
      .reverse()
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
  }, [favorites, products])

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('header.favorites')}</h1>
        {count > 0 && (
          <p className="mt-2 text-sm text-gray-600">{format(t('fav.count'), { n: count })}</p>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-lg" style={{ color: 'var(--color-error)' }}>
                {t('fav.error')}
              </p>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
          ) : display.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-gray-300">
                <HeartIcon filled={false} className="!h-12 !w-12" />
              </span>
              <p className="mt-5 text-lg text-ink">{t('fav.empty')}</p>
              <Link to="/shop" className="btn btn-primary mt-6">
                {t('common.browseShop')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {display.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
