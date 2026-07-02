import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { formatPrice } from '../lib/format'
import { fetchFeaturedProduct, type Product } from '../lib/products'

const CURRENCY = 'ILS'

/* Yellow dot separator for the trust line. */
function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-yellow" aria-hidden="true" />
}

/* Eyewear motif + logo for the missing-image fallback (cream/light background). */
function HeroFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-cream">
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink/20" aria-hidden="true">
        <circle cx="30" cy="34" r="17" />
        <circle cx="90" cy="34" r="17" />
        <path d="M47 30h26" />
        <path d="M13 26l-8-6M107 26l8-6" />
      </svg>
      <img src="/hiba-logo.png" alt="Hiba Optics" className="h-10 w-auto opacity-80" />
    </div>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [imageBroken, setImageBroken] = useState(false)
  const [featured, setFeatured] = useState<Product | null>(null)

  useEffect(() => {
    let active = true
    fetchFeaturedProduct()
      .then((p) => active && setFeatured(p))
      .catch(() => active && setFeatured(null))
    return () => {
      active = false
    }
  }, [])

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

  const floatAnim = reduce ? undefined : { y: [0, -16, 0] }
  const floatTrans = { duration: 7, repeat: Infinity, ease: 'easeInOut' as const }
  const cueAnim = reduce ? undefined : { y: [0, 8, 0] }
  const cueTrans = { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }

  const featuredImage = featured?.images?.[0]
  const featuredPrice =
    featured != null
      ? Number(featured.sale_price ?? featured.price)
      : 0

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 md:min-h-[max(580px,86vh)] md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:py-20">
        {/* INFO — right column in RTL (first in DOM) */}
        <motion.div
          variants={container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="text-right"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-medium tracking-[0.2em] text-gray-600">
              مركز هبة الطبي للبصريات
            </span>
          </motion.div>

          {/* Headline — the oversized moment */}
          <motion.h1
            variants={headline}
            className="mt-6 font-black text-ink"
            style={{ fontSize: 'clamp(38px, 6.5vw, 74px)', lineHeight: 1.02, letterSpacing: '-0.02em' }}
          >
            <motion.span variants={item} className="block">رؤية أوضح،</motion.span>
            <motion.span variants={item} className="block">
              إطلالة <span className="text-yellow">أرقى</span>
            </motion.span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={item}
            className="mt-6 max-w-[300px] text-[15px] leading-[1.7] text-gray-600"
          >
            نظارات طبية وشمسية من أرقى البراندات العالمية، وفحص نظر شامل في نابلس وحوارة.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-wrap gap-4">
            <Link to="/shop" className="btn btn-primary">
              تسوّق النظارات
            </Link>
            <Link to="/book" className="btn btn-secondary">
              احجز فحص نظر
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600"
          >
            <span>براندات أصلية</span>
            <Dot />
            <span>فحص نظر شامل</span>
            <Dot />
            <span>فرعان في نابلس وحوارة</span>
          </motion.div>
        </motion.div>

        {/* IMAGE — left column in RTL */}
        <div className="relative">
          {/* Soft yellow arc peeking behind the card */}
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-10 -left-10 z-0 h-56 w-56 rounded-full bg-yellow/20"
            animate={floatAnim}
            transition={floatTrans}
          />

          {/* Off-center image card */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto aspect-[4/5] w-[88%] overflow-hidden rounded-[var(--radius-lg)] shadow-card"
          >
            {imageBroken ? (
              <HeroFallback />
            ) : (
              <img
                src="/hero/hero-1.jpg"
                alt="نظارات هبة"
                onError={() => setImageBroken(true)}
                className="h-full w-full object-cover"
              />
            )}
          </motion.div>

          {/* Floating featured-product card (hidden if none / error) */}
          {featured && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-6 -left-2 z-20 w-44 rounded-[var(--radius)] border border-gray-100 bg-white p-2.5 shadow-card sm:-left-4"
            >
              <Link to={`/product/${featured.id}`} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream">
                  {featuredImage ? (
                    <img src={featuredImage} alt={featured.name_ar} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-latin text-[10px] font-bold text-ink/25" dir="ltr">Hiba</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{featured.name_ar}</p>
                  <p className="num text-sm font-bold text-ink">{formatPrice(featuredPrice, CURRENCY)}</p>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex"
        animate={cueAnim}
        transition={cueTrans}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink/40">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </motion.div>
    </section>
  )
}
