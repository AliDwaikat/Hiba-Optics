import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { useLanguage } from '../lib/language'
import { fetchProducts } from '../lib/products'
import { primaryImage } from '../lib/productImages'
import FrameSpinner, { type HeroFrame } from './home/FrameSpinner'

const MAX_FRAMES = 8
const RING_MIN = 3 // when fewer unique photos exist, loop them so the ring still looks full

/**
 * Frames for the hero spinner: every published product that has a real image
 * (variants[].images[0]), featured ones first but NOT required — any published
 * product with a photo fills the rest. When only 1–2 photos exist, the images
 * are looped to fill a nice rotating ring; only a total absence of images
 * yields an empty list (→ line-art fallback).
 */
async function loadHeroFrames(): Promise<HeroFrame[]> {
  const all = await fetchProducts({})
  const withImage = all
    .map((p) => ({ p, image: primaryImage(p) }))
    .filter((x): x is { p: (typeof all)[number]; image: string } => Boolean(x.image))

  // Featured first, then any other published product that has a photo.
  const featured = withImage.filter((x) => x.p.featured)
  const ordered = [...featured, ...withImage.filter((x) => !x.p.featured)]

  const unique: HeroFrame[] = ordered.slice(0, MAX_FRAMES).map(({ p, image }) => ({
    id: p.id,
    image,
    name_ar: p.name_ar,
    name_en: p.name_en,
  }))

  if (unique.length === 0) return []
  if (unique.length >= RING_MIN) return unique

  // Only 1–2 photos: loop them to fill a fuller ring (3 for one, 4 for two).
  const target = unique.length === 1 ? 3 : 4
  return Array.from({ length: target }, (_, i) => unique[i % unique.length])
}

/* Yellow dot separator for the trust line. */
function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-yellow" aria-hidden="true" />
}

/* Line-art eyeglasses — ink frame with yellow "smile" curves (echoing the logo). */
function GlassesArt() {
  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="relative z-10 w-[190px] text-ink sm:w-[230px]"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="3.5">
        <rect x="16" y="30" width="86" height="60" rx="26" />
        <rect x="138" y="30" width="86" height="60" rx="26" />
        <path d="M102 52 Q120 40 138 52" />
        <path d="M16 44 3 35" />
        <path d="M224 44 237 35" />
      </g>
      <g className="stroke-yellow" strokeWidth="4">
        <path d="M42 60 Q59 74 76 60" />
        <path d="M164 60 Q181 74 198 60" />
      </g>
    </svg>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const { t } = useLanguage()

  // Hero frame photos (dynamic). null = still loading → show the line-art
  // fallback so the hero never flashes empty during photo rollout.
  const [frames, setFrames] = useState<HeroFrame[] | null>(null)
  useEffect(() => {
    let active = true
    loadHeroFrames()
      .then((f) => active && setFrames(f))
      .catch(() => active && setFrames([]))
    return () => {
      active = false
    }
  }, [])
  // Show the spinner whenever there's at least one product photo (the loader
  // loops a few images to fill the ring); only a total absence → line-art.
  const showSpinner = frames !== null && frames.length >= 1

  // Entrance: staggered fade-up (nested for the two headline lines).
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  }
  const headline: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  const ringFloat = reduce ? undefined : { y: [0, -12, 0] }
  const ringTrans = { duration: 8, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 md:min-h-[max(580px,86vh)] md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:py-20">
        {/* INFO — right column in RTL (first in DOM) */}
        <motion.div
          variants={container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="text-start"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="h-[3px] w-[22px] shrink-0 bg-yellow" aria-hidden="true" />
            <span className="text-sm font-medium tracking-wide text-ink">
              {t('hero.eyebrow')}
            </span>
          </motion.div>

          {/* Headline — the oversized moment */}
          <motion.h1
            variants={headline}
            className="mt-6 font-extrabold text-ink"
            style={{ fontSize: 'clamp(38px, 6.5vw, 74px)', lineHeight: 1.08, letterSpacing: '-0.02em' }}
          >
            <motion.span variants={item} className="block">{t('hero.headline.l1')}</motion.span>
            <motion.span variants={item} className="block">
              {t('hero.headline.l2pre')}<span className="text-yellow">{t('hero.headline.l2hl')}</span>
            </motion.span>
          </motion.h1>

          {/* Subhead */}
          <motion.p variants={item} className="mt-6 max-w-[340px] text-[15px] leading-[1.7] text-gray-600">
            {t('hero.subhead')}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
            <Link to="/shop" className="btn btn-primary">
              {t('hero.cta.shop')}
            </Link>
            <Link to="/book" className="btn btn-secondary">
              {t('cta.bookExam')}
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
            <span>{t('hero.trust.1')}</span>
            <Dot />
            <span>{t('hero.trust.2')}</span>
            <Dot />
            <span>{t('hero.trust.3')}</span>
          </motion.div>
        </motion.div>

        {/* VISUAL — left column in RTL. 3D frame spinner when enough photos
            exist, otherwise the line-art fallback. */}
        {showSpinner ? (
          <FrameSpinner frames={frames as HeroFrame[]} />
        ) : (
          <div className="relative flex items-center justify-center py-4">
            {/* Thin yellow rings behind the glasses (crisp, no fills) */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute h-[206px] w-[206px] rounded-full border-[1.5px] border-yellow opacity-[0.35]"
              animate={ringFloat}
              transition={ringTrans}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute h-[248px] w-[248px] rounded-full border border-yellow opacity-[0.15]"
            />

            {/* Glasses line-art */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <GlassesArt />
            </motion.div>
          </div>
        )}
      </div>
    </section>
  )
}
