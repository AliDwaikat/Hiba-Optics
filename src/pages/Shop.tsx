import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'
import {
  fetchBrands,
  fetchProducts,
  type Brand,
  type Category,
  type Product,
} from '../lib/products'

type CategoryTab = Category | 'all'

const CATEGORY_TABS: { value: CategoryTab; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'sunglasses', label: 'شمسية' },
  { value: 'optical', label: 'طبية' },
  { value: 'contact_lenses', label: 'عدسات لاصقة' },
  { value: 'accessories', label: 'إكسسوارات' },
]

function pillClass(active: boolean): string {
  return [
    'whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
    active
      ? 'bg-yellow font-semibold text-ink'
      : 'bg-gray-900 text-gray-300 hover:text-white',
  ].join(' ')
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded-xl bg-gray-900" />
      <div className="mt-3 h-3 w-1/2 rounded bg-gray-900" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-900" />
      <div className="mt-2 h-4 w-1/3 rounded bg-gray-900" />
    </div>
  )
}

export default function Shop() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<CategoryTab>('all')
  // Initialize from a ?brand=<id> URL param (e.g. arriving from /brands); it is
  // validated against the loaded brand list below and cleared if unknown.
  const [brandId, setBrandId] = useState<string | null>(
    () => new URLSearchParams(window.location.search).get('brand'),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const brandNameById = useMemo(
    () => new Map(brands.map((b) => [b.id, b.name_ar])),
    [brands],
  )

  // Brands load once; failure just hides the brand chips (products remain usable).
  useEffect(() => {
    let active = true
    fetchBrands()
      .then((data) => {
        if (!active) return
        setBrands(data)
        // Drop a ?brand= param that doesn't match a known brand (→ all brands).
        setBrandId((prev) => (prev && !data.some((b) => b.id === prev) ? null : prev))
      })
      .catch(() => {
        if (active) setBrands([])
      })
    return () => {
      active = false
    }
  }, [])

  // Products refetch whenever a filter changes.
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchProducts({ category: category === 'all' ? null : category, brandId })
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
  }, [category, brandId])

  return (
    <main className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={pillClass(category === tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Brand chips (horizontally scrollable) */}
        {brands.length > 0 && (
          <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setBrandId(null)}
              className={pillClass(brandId === null)}
            >
              كل البراندات
            </button>
            {brands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => setBrandId(brand.id)}
                className={pillClass(brandId === brand.id)}
              >
                {brand.name_ar}
              </button>
            ))}
          </div>
        )}

        {/* Grid / states */}
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
                تعذّر تحميل المنتجات
              </p>
              <p className="mt-2 text-sm text-gray-300">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-white">لا توجد منتجات</p>
              <p className="mt-2 text-sm text-gray-300">جرّبي تغيير الفلاتر</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  brandName={product.brand_id ? brandNameById.get(product.brand_id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
