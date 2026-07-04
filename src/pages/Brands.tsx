import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { useLanguage } from '../lib/language'
import { fetchBrandsWithCounts, type BrandWithCount } from '../lib/products'

/* One brand card — logo when present, else an elegant name_en treatment. */
function BrandCard({ brand }: { brand: BrandWithCount }) {
  const { t, localize } = useLanguage()
  const [logoBroken, setLogoBroken] = useState(false)
  const showLogo = Boolean(brand.logo_url) && !logoBroken
  const localizedName = localize(brand, 'name')

  return (
    <Link to={`/shop?brand=${brand.id}`} className="group block h-full">
      <div className="flex h-full flex-col items-center rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <div className="flex h-14 items-center justify-center">
          {showLogo ? (
            <img
              src={brand.logo_url as string}
              alt={brand.name_en}
              onError={() => setLogoBroken(true)}
              className="max-h-12 w-auto object-contain"
            />
          ) : (
            <span className="latin text-2xl font-medium tracking-[0.08em] text-ink">
              {brand.name_en}
            </span>
          )}
        </div>

        {localizedName !== brand.name_en && (
          <p className="mt-3 text-sm text-gray-600">{localizedName}</p>
        )}

        <p className="mt-2 text-xs text-gray-600">
          {brand.product_count > 0 ? (
            <>
              <span className="num">{brand.product_count}</span> {t('brands.products')}
            </>
          ) : (
            t('brands.soon')
          )}
        </p>

        <span className="mt-4 text-xs font-semibold text-yellow-deep opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {t('brands.browse')}{' '}
          <span aria-hidden="true" className="rtl:inline ltr:hidden">←</span>
          <span aria-hidden="true" className="ltr:inline rtl:hidden">→</span>
        </span>
      </div>
    </Link>
  )
}

function BrandSkeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-lg)] bg-gray-100 p-8">
      <div className="mx-auto h-10 w-2/3 rounded bg-gray-300/50" />
      <div className="mx-auto mt-4 h-3 w-1/3 rounded bg-gray-300/50" />
      <div className="mx-auto mt-3 h-3 w-1/4 rounded bg-gray-300/50" />
    </div>
  )
}

export default function Brands() {
  const { t } = useLanguage()
  const [brands, setBrands] = useState<BrandWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchBrandsWithCounts()
      .then((data) => {
        if (!active) return
        setBrands(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setBrands([]) // empty / error → friendly message below
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Intro */}
        <Reveal className="text-start">
          <div className="flex items-center justify-start gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">{t('brands.eyebrow')}</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">{t('brands.title')}</h1>
          <p className="mt-3 text-gray-600">{t('brands.sub')}</p>
        </Reveal>

        {/* Grid / states */}
        <div className="mt-10 sm:mt-12">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <BrandSkeleton key={i} />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <p className="py-16 text-center text-lg text-gray-600">{t('brands.empty')}</p>
          ) : (
            <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {brands.map((brand) => (
                <RevealItem key={brand.id} className="h-full">
                  <BrandCard brand={brand} />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </div>
      </div>
    </main>
  )
}
