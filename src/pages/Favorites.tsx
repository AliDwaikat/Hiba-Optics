import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { SkeletonProductGrid } from '../components/Skeleton'
import HeartIcon from '../components/HeartIcon'
import { useFavorites } from '../lib/favorites'
import { useLanguage } from '../lib/language'
import { format } from '../lib/i18n'
import { fetchProductsByIds, type Product } from '../lib/products'

export default function Favorites() {
  const { t } = useLanguage()
  // `favLoading` is true while the logged-in user's DB favorites resolve.
  const { favorites, count, loading: favLoading } = useFavorites()
  // Accumulated product cache keyed by id — never drops rows, so un-hearting is
  // instant (display is derived from LIVE favorites) and new hearts fetch lazily.
  const [productMap, setProductMap] = useState<Map<string, Product>>(new Map())
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch products for any favorite ids we don't have yet. Reacts to the source
  // changing (e.g. DB favorites arriving after login, or a new heart).
  useEffect(() => {
    const missing = favorites.filter((id) => !productMap.has(id))
    if (missing.length === 0) return
    let active = true
    setFetching(true)
    fetchProductsByIds(missing)
      .then((data) => {
        if (!active) return
        setProductMap((prev) => {
          const m = new Map(prev)
          for (const p of data) m.set(p.id, p)
          return m
        })
        setFetching(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
        setFetching(false)
      })
    return () => {
      active = false
    }
  }, [favorites, productMap])

  // Newest favorites first; skip any that no longer exist / are unpublished.
  const display = useMemo(() => {
    return [...favorites]
      .reverse()
      .map((id) => productMap.get(id))
      .filter((p): p is Product => Boolean(p))
  }, [favorites, productMap])

  // Skeleton while the DB favorites resolve, or while the first product batch
  // for a non-empty list is still loading.
  const loading = favLoading || (fetching && display.length === 0 && favorites.length > 0)

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('header.favorites')}</h1>
        {count > 0 && (
          <p className="mt-2 text-sm text-gray-600">{format(t('fav.count'), { n: count })}</p>
        )}

        <div className="mt-8">
          {loading ? (
            <SkeletonProductGrid count={8} />
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
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
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
