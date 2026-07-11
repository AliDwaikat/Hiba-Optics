import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { formatPrice } from '../lib/format'
import { useLanguage } from '../lib/language'
import { AUDIENCE_LABEL_KEY, format, type UIKey } from '../lib/i18n'
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

const CATEGORY_TABS: { value: CategoryTab; labelKey: UIKey }[] = [
  { value: 'all', labelKey: 'shop.cat.all' },
  { value: 'sunglasses', labelKey: 'shop.cat.sunglasses' },
  { value: 'optical', labelKey: 'shop.cat.optical' },
  { value: 'contact_lenses', labelKey: 'shop.cat.contact_lenses' },
  { value: 'accessories', labelKey: 'shop.cat.accessories' },
]
const CATEGORY_VALUES = new Set<string>(['sunglasses', 'optical', 'contact_lenses', 'accessories'])

const AUDIENCE_TABS: { value: AudienceTab; labelKey: UIKey }[] = [
  { value: 'all', labelKey: 'shop.aud.all' },
  { value: 'men', labelKey: 'shop.aud.men' },
  { value: 'women', labelKey: 'shop.aud.women' },
  { value: 'unisex', labelKey: 'shop.aud.unisex' },
  { value: 'kids', labelKey: 'shop.aud.kids' },
]
const AUDIENCE_VALUES = new Set<string>(['men', 'women', 'unisex', 'kids'])

const SORT_OPTIONS: { value: SortKey; labelKey: UIKey }[] = [
  { value: 'newest', labelKey: 'shop.sort.newest' },
  { value: 'price_asc', labelKey: 'shop.sort.price_asc' },
  { value: 'price_desc', labelKey: 'shop.sort.price_desc' },
  { value: 'featured', labelKey: 'shop.sort.featured' },
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
function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  )
}

export default function Shop() {
  const { t, localize } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // URL-backed filters (shareable + back/forward): category + brand + audience.
  const categoryParam = searchParams.get('category')
  const category: CategoryTab = categoryParam && CATEGORY_VALUES.has(categoryParam)
    ? (categoryParam as Category)
    : 'all'
  const brandId = searchParams.get('brand')
  const audienceParam = searchParams.get('audience')
  const audience: AudienceTab = audienceParam && AUDIENCE_VALUES.has(audienceParam)
    ? (audienceParam as Audience)
    : 'all'

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
  const setAudience = (a: AudienceTab) =>
    updateParams((p) => (a === 'all' ? p.delete('audience') : p.set('audience', a)))

  // Local (non-URL) filters + sort.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Map id → localized brand name (Arabic default, English when lang='en').
  const brandNameById = useMemo(
    () => new Map(brands.map((b) => [b.id, localize(b, 'name')])),
    [brands, localize],
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
    const map = new Map<string, { key: string; name_ar: string; name_en: string; hex: string }>()
    for (const p of products) {
      for (const c of p.colors ?? []) {
        if (!c?.name_ar || !c?.hex) continue
        const key = colorKey(c.name_ar, c.hex)
        if (!map.has(key)) map.set(key, { key, name_ar: c.name_ar, name_en: c.name_en ?? '', hex: c.hex })
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
    setInStockOnly(false)
    setSelectedColors(new Set())
    setPriceRange({ min: bounds.min, max: bounds.max })
    updateParams((p) => {
      p.delete('category')
      p.delete('brand')
      p.delete('audience')
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

  // Advanced = everything that now lives inside the filter panel: brand,
  // audience, price, availability, colors. (Category stays in the always-visible
  // chip row, so it is intentionally NOT counted here.)
  const advancedActiveCount =
    (brandId ? 1 : 0) +
    (audience !== 'all' ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    selectedColors.size

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
        {/* Brand */}
        {brands.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{t('shop.brand.label')}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBrandId(null)}
                className={pillClass(brandId === null)}
              >
                {t('shop.brand.all')}
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setBrandId(brand.id)}
                  className={pillClass(brandId === brand.id)}
                >
                  {localize(brand, 'name')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Audience */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t('shop.aud.label')}</p>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_TABS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAudience(a.value)}
                className={pillClass(audience === a.value)}
              >
                {t(a.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        {bounds.max > bounds.min && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              {t('shop.price.label')}{' '}
              <span className="num font-normal text-gray-600">
                {formatPrice(range.min, 'ILS')} – {formatPrice(range.max, 'ILS')}
              </span>
            </p>
            <div className="flex items-center gap-3">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-600">{t('shop.price.min')}</span>
                <input
                  type="number"
                  dir="ltr"
                  inputMode="numeric"
                  min={bounds.min}
                  max={bounds.max}
                  value={range.min}
                  onChange={(e) => setMin(e.target.value)}
                  className="field"
                  aria-label={t('shop.price.minAria')}
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-600">{t('shop.price.max')}</span>
                <input
                  type="number"
                  dir="ltr"
                  inputMode="numeric"
                  min={bounds.min}
                  max={bounds.max}
                  value={range.max}
                  onChange={(e) => setMax(e.target.value)}
                  className="field"
                  aria-label={t('shop.price.maxAria')}
                />
              </label>
            </div>
          </div>
        )}

        {/* Availability */}
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{t('shop.avail.label')}</p>
          <button
            type="button"
            onClick={() => setInStockOnly((v) => !v)}
            aria-pressed={inStockOnly}
            className={pillClass(inStockOnly)}
          >
            {t('shop.avail.inStock')}
          </button>
        </div>

        {/* Colors */}
        {allColors.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{t('shop.color.label')}</p>
            <div className="flex flex-wrap gap-2">
              {allColors.map((c) => {
                const selected = selectedColors.has(c.key)
                const colorName = localize(c, 'name')
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColor(c.key)}
                    aria-pressed={selected}
                    title={colorName}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition-colors ${
                      selected ? 'border-yellow-deep bg-gray-100 text-ink' : 'border-gray-300 text-gray-600 hover:text-ink'
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    {colorName}
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
    if (range.max < bounds.max)
      return format(t('shop.price.under'), { x: formatPrice(range.max, 'ILS') })
    return format(t('shop.price.over'), { x: formatPrice(range.min, 'ILS') })
  }

  function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pe-2 ps-3 text-xs text-ink">
        {label}
        <button
          type="button"
          onClick={onRemove}
          aria-label={format(t('shop.chip.remove'), { label })}
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
              <span className="font-bold">{t('shop.finder.title')}</span>
              <span className="hidden text-gray-600 sm:inline">{t('shop.finder.subtitle')}</span>
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-yellow-deep">
            {t('shop.finder.start')}{' '}
            <span aria-hidden="true" className="rtl:inline ltr:hidden">←</span>
            <span aria-hidden="true" className="ltr:inline rtl:hidden">→</span>
          </span>
        </Link>

        {/* Compact top bar: search (flexible) + sort + filters button.
            Single row on desktop, wraps to search-then-controls on mobile. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-600">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('shop.search.placeholder')}
              aria-label={t('shop.search.aria')}
              className="field ps-10 pe-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label={t('shop.search.clear')}
                className="absolute inset-y-0 end-3 flex items-center text-gray-600 transition-colors hover:text-ink"
              >
                <ClearIcon />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="hidden text-sm text-gray-600 sm:inline">{t('shop.sort.label')}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label={t('shop.sort.label')}
                className="field w-auto"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            {/* Filters button — all viewports; opens the filter panel. */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius)] border border-gray-300 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-yellow-deep"
            >
              <FilterIcon />
              {t('shop.filters')}
              {advancedActiveCount > 0 && (
                <span className="num flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
                  {advancedActiveCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category — the primary, always-visible filter: one line, scrolls
            horizontally on overflow (never wraps into a second tall row). */}
        <div className="mt-4 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setCategory(tab.value)}
              className={pillClass(category === tab.value)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Active-filters summary + result count */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="num text-sm text-gray-600">{format(t('shop.results'), { n: results.length })}</span>
          {anyFilterActive && <span className="mx-1 h-4 w-px bg-gray-300" aria-hidden="true" />}
          {search.trim() !== '' && (
            <Chip label={format(t('shop.search.chip'), { q: search.trim() })} onRemove={() => setSearchInput('')} />
          )}
          {category !== 'all' && (
            <Chip
              label={t(CATEGORY_TABS.find((c) => c.value === category)?.labelKey ?? 'shop.cat.all')}
              onRemove={() => setCategory('all')}
            />
          )}
          {brandId && (
            <Chip label={brandNameById.get(brandId) ?? ''} onRemove={() => setBrandId(null)} />
          )}
          {audience !== 'all' && (
            <Chip label={t(AUDIENCE_LABEL_KEY[audience as Audience])} onRemove={() => setAudience('all')} />
          )}
          {priceActive && <Chip label={priceChipLabel()} onRemove={resetPrice} />}
          {inStockOnly && <Chip label={t('shop.avail.inStock')} onRemove={() => setInStockOnly(false)} />}
          {Array.from(selectedColors).map((key) => {
            const c = allColors.find((x) => x.key === key)
            return (
              <Chip key={key} label={c ? localize(c, 'name') : ''} onRemove={() => toggleColor(key)} />
            )
          })}
          {anyFilterActive && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-gray-600 underline-offset-2 transition-colors hover:text-ink hover:underline"
            >
              {t('shop.clearAll')}
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
                {t('shop.error')}
              </p>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg text-ink">{t('shop.empty.title')}</p>
              <button type="button" onClick={clearAll} className="btn btn-secondary mt-6">
                {t('shop.empty.clear')}
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

      {/* Filter panel — slide-in drawer from the inline-end edge on all
          viewports; full-width sheet on mobile. dir-aware slide (off the end
          edge when closed). Backdrop dims + closes; body scroll is locked. */}
      <div
        className={`fixed inset-0 z-50 ${drawerOpen ? '' : 'pointer-events-none'}`}
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
          aria-label={t('shop.drawer.title')}
          className={`absolute inset-y-0 end-0 flex h-full w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            drawerOpen ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-lg font-bold text-ink">{t('shop.drawer.title')}</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t('header.close')}
              className="text-ink transition-colors hover:text-yellow-deep"
            >
              <ClearIcon />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{renderAdvancedFilters()}</div>
          <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                clearAll()
              }}
              className="btn btn-secondary flex-1"
            >
              {t('shop.clearAll')}
            </button>
            <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-primary flex-1">
              {t('shop.apply')}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
