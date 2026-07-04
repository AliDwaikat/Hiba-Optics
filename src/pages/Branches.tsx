import { useEffect, useState } from 'react'
import { Reveal } from '../components/home/Reveal'
import { useLanguage } from '../lib/language'
import { format } from '../lib/i18n'
import { fetchBranches, type Branch } from '../lib/branches'
import { telLink, whatsappLink } from '../lib/contact'

/* ---------- Icons ---------- */
function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-yellow-deep" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-yellow-deep" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}
function DirectionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.7 11.3 12.7 2.3a1 1 0 0 0-1.4 0l-9 9a1 1 0 0 0 0 1.4l9 9a1 1 0 0 0 1.4 0l9-9a1 1 0 0 0 0-1.4Z" />
      <path d="M9 13v-2a2 2 0 0 1 2-2h4" />
      <path d="m14 7 2 2-2 2" />
    </svg>
  )
}

/* ---------- Map / directions link builders ---------- */
function mapSrc(b: Branch): string {
  if (b.map_url) return b.map_url
  if (b.lat != null && b.lng != null) {
    return `https://maps.google.com/maps?q=${b.lat},${b.lng}&z=16&output=embed`
  }
  const q = encodeURIComponent(`${b.address_ar ?? ''} ${b.landmark_ar ?? ''}`.trim())
  return `https://maps.google.com/maps?q=${q}&z=15&output=embed`
}

function directionsLink(b: Branch): string {
  if (b.map_url) return b.map_url
  if (b.lat != null && b.lng != null) return `https://www.google.com/maps?q=${b.lat},${b.lng}`
  const q = encodeURIComponent(`${b.name_ar} ${b.address_ar ?? ''} ${b.landmark_ar ?? ''}`.trim())
  return `https://www.google.com/maps?q=${q}`
}

/* ---------- Branch block ---------- */
function BranchBlock({ branch, index }: { branch: Branch; index: number }) {
  const { t, localize } = useLanguage()
  const even = index % 2 === 0
  // DOM order is info-then-map (info first on mobile); order utilities alternate
  // sides on desktop and flip with the writing direction automatically.
  const infoOrder = even ? 'md:order-2' : 'md:order-1'
  const mapOrder = even ? 'md:order-1' : 'md:order-2'
  const name = localize(branch, 'name')
  const address = localize(branch, 'address')
  const landmark = localize(branch, 'landmark')

  return (
    <Reveal>
      <div className="grid items-stretch gap-6 md:grid-cols-2 md:gap-10">
        {/* Info */}
        <div className={`flex flex-col rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card sm:p-8 ${infoOrder}`}>
          <h2 className="text-2xl font-extrabold text-ink">{name}</h2>

          <div className="mt-4 flex items-start gap-2 text-gray-600">
            <PinIcon />
            <span className="leading-relaxed">
              {address}
              {landmark && (
                <>
                  {address ? ' — ' : ''}
                  {landmark}
                </>
              )}
            </span>
          </div>

          {branch.hours_ar && (
            <div className="mt-3 flex items-start gap-2 text-gray-600">
              <ClockIcon />
              <span className="leading-relaxed">{branch.hours_ar}</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {branch.whatsapp && (
              <a href={whatsappLink(branch.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <WhatsAppIcon />
                {t('branches.whatsapp')}
              </a>
            )}
            {branch.phone && (
              <a href={telLink(branch.phone)} className="btn btn-secondary">
                {t('branches.callBtn')}
              </a>
            )}
            <a href={directionsLink(branch)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <DirectionsIcon />
              {t('branches.directions')}
            </a>
          </div>
        </div>

        {/* Map */}
        <div className={`overflow-hidden rounded-[var(--radius-lg)] shadow-card ${mapOrder}`}>
          <iframe
            src={mapSrc(branch)}
            title={format(t('branches.mapTitle'), { name })}
            loading="lazy"
            className="h-[240px] w-full border-0 md:h-[320px]"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- Skeleton ---------- */
function BranchSkeleton() {
  return (
    <div className="grid animate-pulse gap-6 md:grid-cols-2 md:gap-10">
      <div className="rounded-[var(--radius-lg)] bg-gray-100 p-8">
        <div className="h-6 w-1/2 rounded bg-gray-300/60" />
        <div className="mt-4 h-4 w-3/4 rounded bg-gray-300/60" />
        <div className="mt-2 h-4 w-2/3 rounded bg-gray-300/60" />
        <div className="mt-6 h-10 w-40 rounded bg-gray-300/60" />
      </div>
      <div className="h-[240px] rounded-[var(--radius-lg)] bg-gray-100 md:h-[320px]" />
    </div>
  )
}

export default function Branches() {
  const { t } = useLanguage()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchBranches()
      .then((data) => {
        if (!active) return
        setBranches(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setBranches([])
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
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">{t('branches.pageEyebrow')}</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">{t('branches.pageTitle')}</h1>
          <p className="mt-3 text-gray-600">{t('branches.pageSub')}</p>
        </Reveal>

        {/* Content */}
        <div className="mt-12 space-y-14 sm:mt-16 sm:space-y-20">
          {loading ? (
            <BranchSkeleton />
          ) : branches.length === 0 ? (
            <p className="py-16 text-center text-lg text-gray-600">{t('branches.empty')}</p>
          ) : (
            branches.map((branch, index) => <BranchBlock key={branch.id} branch={branch} index={index} />)
          )}
        </div>
      </div>
    </main>
  )
}
