import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { formatPrice } from '../lib/format'
import {
  fetchBrands,
  fetchProducts,
  type Audience,
  type Brand,
  type Category,
  type Product,
} from '../lib/products'

type CategoryTab = Category | 'all'
type AudienceTab = Audience | 'all'
type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'featured'

const CATEGORY_TABS: { value: CategoryTab; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'sunglasses', label: 'شمسية' },
  { value: 'optical', label: 'طبية' },
  { value: 'contact_lenses', label: 'عدسات لاصقة' },
  { value: 'accessories', label: 'إكسسوارات' },
]
const CATEGORY_VALUES = new Set<string>(['sunglasses', 'optical', 'contact_lenses', 'accessories'])

const AUDIENCE_TABS: { value: AudienceTab; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'men', label: 'رجالي' },
  { value: 'women', label: 'نسائي' },
  { value: 'unisex', label: 'للجنسين' },
  { value: 'kids', label: 'أطفال' },
]
const AUDIENCE_LABELS: Record<Audience, string> = {
  men: 'رجالي',
  women: 'نسائي',
  unisex: 'للجنسين',
  kids: 'أطفال',
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'featured', label: 'المميزة أولاً' },
]

/** Price shown/used for filtering + sorting: sale_price when it's a real discount. */
function effectivePrice(p: Product): number {
  const price = Number(p.price)
  const sale = p.sale_price != null ? Number(p.sale_price) : null
  return sale != null && sale < price ? sale : price
}

function colorKey(name_ar: string, hex: string): string {
  return `${name_ar.trim()}__${hex.trim().toLowerCase()}`
}

function pillClass(active: boolean): string {
  return [
    'whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
    active ? 'bg-yellow font-semibold text-ink' : 'bg-gray-100 text-gray-600 hover:text-ink',
  ].join(' ')
}

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

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL-backed filters (shareable + back/forward): category + brand.
  const categoryParam = searchParams.get('category')
  const category: CategoryTab = categoryParam && CATEGORY_VALUES.has(categoryParam)
    ? (categoryParam as Category)
    : 'all'
  const brandId = searchParams.get('brand')

  function updateParams(mut: (p: URLSearchParams) => void, replace = false) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        mut(p)
        return p
      },
      { replace },
    )
  }
  const setCategory = (c: CategoryTab) =>
    updateParams((p) => (c === 'all' ? p.delete('category') : p.set('category', c)))
  const setBrandId = (id: string | null) =>
    updateParams((p) => (id ? p.set('brand', id) : p.delete('brand')))

  // Local (non-URL) filters + sort.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState<AudienceTab>('all')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const brandNameById = useMemo(
    () => new Map(brands.map((b) => [b.id, b.name_ar])),
    [brands],
  )

  // Debounce the search input (~200ms).
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 200)
    return () => window.clearTimeout(t)
  }, [searchInput])

  // Brands load once.
  useEffect(() => {
    let active = true
    fetchBrands()
      .then((data) => active && setBrands(data))
      .catch(() => active && setBrands([]))
    return () => {
      active = false
    }
  }, [])

  // Drop an unknown ?brand= once brands are known (replace → no history noise).
  useEffect(() => {
    if (brands.length && brandId && !brands.some((b) => b.id === brandId)) {
      updateParams((p) => p.delete('brand'), true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, brandId])

  // All published products fetched once; filtering/sorting is client-side (~30 rows).
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchProducts({})
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
  }, [])

  // Catalog price bounds (across all fetched products), and the distinct colors.
  const bounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    let min = Infinity
    let max = -Infinity
    for (const p of products) {
      const v = effectivePrice(p)
      if (v < min) min = v
      if (v > max) max = v
    }
    return { min: Math.floor(min), max: Math.ceil(max) }
  }, [products])

  const allColors = useMemo(() => {
    const map = new Map<string, { key: string; name_ar: string; hex: string }>()
    for (const p of products) {
      for (const c of p.colors ?? []) {
        if (!c?.name_ar || !c?.hex) continue
        const key = colorKey(c.name_ar, c.hex)
        if (!map.has(key)) map.set(key, { key, name_ar: c.name_ar, hex: c.hex })
      }
    }
    return Array.from(map.values())
  }, [products])

  // Initialize the price range to the full catalog span once known.
  useEffect(() => {
    if (products.length > 0 && priceRange === null) {
      setPriceRange({ min: bounds.min, max: bounds.max })
    }
  }, [products, bounds, priceRange])

  const range = priceRange ?? bounds
  const priceActive = priceRange !== null && (range.min > bounds.min || range.max < bounds.max)

  function setMin(raw: string) {
    const n = raw.trim() === '' ? bounds.min : Number(raw)
    if (!Number.isFinite(n)) return
    const clamped = Math.min(Math.max(n, bounds.min), range.max)
    setPriceRange({ min: clamped, max: range.max })
  }
  function setMax(raw: string) {
    const n = raw.trim() === '' ? bounds.max : Number(raw)
    if (!Number.isFinite(n)) return
    const clamped = Math.max(Math.min(n, bounds.max), range.min)
    setPriceRange({ min: range.min, max: clamped })
  }
  const resetPrice = () => setPriceRange({ min: bounds.min, max: bounds.max })

  function toggleColor(key: string) {
    setSelectedColors((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  }

  function clearAll() {
    setSearchInput('')
    setSearch('')
    setAudience('all')
    setInStockOnly(false)
    setSelectedColors(new Set())
    setPriceRange({ min: bounds.min, max: bounds.max })
    updateParams((p) => {
      p.delete('category')
      p.delete('brand')
    })
  }

  // Filter → sort pipeline.
  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = products.filter((p) => {
      if (q) {
        const hay = `${p.name_ar} ${p.name_en} ${p.model ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (category !== 'all' && p.category !== category) return false
      if (brandId && p.brand_id !== brandId) return false
      if (audience !== 'all' && p.audience !== audience) return false
      const eff = effectivePrice(p)
      if (eff < range.min || eff > range.max) return false
      if (inStockOnly && !p.in_stock) return false
      if (selectedColors.size > 0) {
        const has = (p.colors ?? []).some((c) => selectedColors.has(colorKey(c.name_ar, c.hex)))
        if (!has) return false
      }
      return true
    })

    const sorted = [...filtered]
    if (sort === 'price_asc') sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b))
    else if (sort === 'price_desc') sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a))
    else if (sort === 'featured')
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || a.position - b.position)
    // 'newest' keeps the fetched order (position ascending).
    return sorted
  }, [products, search, category, brandId, audience, range, inStockOnly, selectedColors, sort])

  const advancedActiveCount =
    (audience !== 'all' ? 1 : 0) + (priceActive ? 1 : 0) + (inStockOnly ? 1 : 0) + selectedColors.size

  const anyFilterActive =
    advancedActiveCount > 0 || category !== 'all' || Boolean(brandId) || search.trim() !== ''

  // Lock body scroll while the mobile filter drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  /* ---- Advanced filters (audience / price / availability / color) — shared by
     the desktop panel and the mobile drawer. ---- */
  function renderAdvancedFilters() {
    return (
      <div className="space-y-5">
        {/* Audience */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">الفئة المستهدفة</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_TABS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAudience(a.value)}
                className={pillClass(audience === a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        {bounds.max > bounds.min && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              السعر:{' '}
              <span className="num font-normal text-gray-600">
                {formatPrice(range.min, 'ILS')} – {formatPrice(range.max, 'ILS')}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-600">من</span>
                <input
                  type="number"
                  dir="ltr"
                  inputMode="numeric"
                  min={bounds.min}
                  max={bounds.max}
                  value={range.min}
                  onChange={(e) => setMin(e.target.value)}
                  className="field"
                  aria-label="أقل سعر"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-600">إلى</span>
                <input
                  type="number"
                  dir="ltr"
                  inputMode="numeric"
                  min={bounds.min}
                  max={bounds.max}
                  value={range.max}
                  onChange={(e) => setMax(e.target.value)}
                  className="field"
                  aria-label="أعلى سعر"
                />
              </label>
            </div>
          </div>
        )}

        {/* Availability */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">التوفّر</p>
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={pillClass(inStockOnly)}
          >
            المتوفر فقط
          </button>
        </div>

        {/* Colors */}
        {allColors.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">اللون</p>
            <div className="flex flex-wrap gap-2">
              {allColors.map((c) => {
                const selected = selectedColors.has(c.key)
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColor(c.key)}
                    aria-pressed={selected}
                    title={c.name_ar}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors ${
                      selected ? 'border-yellow-deep bg-gray-100 text-ink' : 'border-gray-300 text-gray-600 hover:text-ink'
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    {c.name_ar}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ---- Active-filter summary chips ---- */
  function priceChipLabel(): string {
    if (range.min > bounds.min && range.max < bounds.max)
      return `${formatPrice(range.min, 'ILS')} – ${formatPrice(range.max, 'ILS')}`
    if (range.max < bounds.max) return `أقل من ${formatPrice(range.max, 'ILS')}`
    return `أكثر من ${formatPrice(range.min, 'ILS')}`
  }

  function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pe-2 ps-3 text-xs text-ink">
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`إزالة ${label}`}
          className="text-gray-600 transition-colors hover:text-ink"
        >
          <ClearIcon />
        </button>
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Face-shape frame finder entry point */}
        <Link
          to="/finder"
          className="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-gray-300 bg-gray-100 px-4 py-3 transition-colors hover:border-yellow-deep"
        >
          <span className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-yellow)' }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round">
                <ellipse cx="24" cy="24" rx="13" ry="18" />
              </svg>
            </span>
            <span className="text-sm text-ink sm:text-base">
              <span className="font-bold">اعثر على إطارك</span>
              <span className="hidden text-gray-600 sm:inline"> — إطارات تناسب شكل وجهك</span>
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-yellow-deep">ابدأ ←</span>
        </Link>

        {/* Search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-600">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث بالاسم أو الموديل…"
              aria-label="بحث"
              className="field ps-10 pe-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="مسح البحث"
                className="absolute inset-y-0 end-3 flex items-center text-gray-600 transition-colors hover:text-ink"
              >
                <ClearIcon />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile: open the filter drawer */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-gray-300 px-4 py-2.5 text-sm font-medium text-ink md:hidden"
            >
              الفلاتر
              {advancedActiveCount > 0 && (
                <span className="num flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
                  {advancedActiveCount}
                </span>
              )}
            </button>

            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">ترتيب</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="ترتيب"
                className="field w-auto"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
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

        {/* Brand chips */}
        {brands.length > 0 && (
          <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <button type="button" onClick={() => setBrandId(null)} className={pillClass(brandId === null)}>
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

        {/* Advanced filters — inline on desktop */}
        <div className="mt-4 hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 md:block">
          {renderAdvancedFilters()}
        </div>

        {/* Active-filters summary + result count */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="num text-sm text-gray-600">{results.length} نتيجة</span>
          {anyFilterActive && <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden="true" />}
          {search.trim() !== '' && (
            <Chip label={`بحث: ${search.trim()}`} onRemove={() => setSearchInput('')} />
          )}
          {category !== 'all' && (
            <Chip
              label={CATEGORY_TABS.find((c) => c.value === category)?.label ?? ''}
              onRemove={() => setCategory('all')}
            />
          )}
          {brandId && (
            <Chip label={brandNameById.get(brandId) ?? 'براند'} onRemove={() => setBrandId(null)} />
          )}
          {audience !== 'all' && (
            <Chip label={AUDIENCE_LABELS[audience as Audience]} onRemove={() => setAudience('all')} />
          )}
          {priceActive && <Chip label={priceChipLabel()} onRemove={resetPrice} />}
          {inStockOnly && <Chip label="المتوفر فقط" onRemove={() => setInStockOnly(false)} />}
          {Array.from(selectedColors).map((key) => {
            const c = allColors.find((x) => x.key === key)
            return (
              <Chip key={key} label={c?.name_ar ?? 'لون'} onRemove={() => toggleColor(key)} />
            )
          })}
          {anyFilterActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-gray-600 underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              مسح الكل
            </button>
          )}
        </div>

        {/* Grid / states */}
        <div className="mt-6">
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
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-ink">لا توجد منتجات مطابقة</p>
              <button type="button" onClick={clearAll} className="btn btn-secondary mt-6">
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {results.map((product) => (
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

      {/* Mobile filter drawer (bottom sheet) */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
          className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="الفلاتر"
          className={`absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[var(--radius-lg)] bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            drawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-ink">الفلاتر</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="إغلاق"
              className="text-ink"
            >
              <ClearIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{renderAdvancedFilters()}</div>
          <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                clearAll()
              }}
              className="btn btn-secondary flex-1"
            >
              مسح الكل
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-1">
              تطبيق
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
