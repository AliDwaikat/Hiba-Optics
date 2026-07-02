import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

/* Yellow dot separator for the trust line. */
function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-yellow" aria-hidden="true" />
}

/* Graceful fallback when /hero/hero-1.jpg is missing — cream frame with a
   yellow arc/blob echoing the logo, and a subtle "Hiba" wordmark. */
function HeroFallback() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-cream">
      <div className="absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-yellow/30" />
      <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[14px] border-yellow/25" />
      <span className="font-latin text-6xl font-bold tracking-tight text-ink/15" dir="ltr">
        Hiba
      </span>
    </div>
  )
}

export default function Hero() {
  const reduce = useReducedMotion()
  const [imageBroken, setImageBroken] = useState(false)

  // Entrance: staggered fade-up. Disabled under prefers-reduced-motion.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }

  const floatAnim = reduce ? undefined : { y: [0, -14, 0] }
  const floatTrans = { duration: 7, repeat: Infinity, ease: 'easeInOut' as const }
  const cueAnim = reduce ? undefined : { y: [0, 8, 0] }
  const cueTrans = { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 md:min-h-[88vh] md:grid-cols-2 md:gap-16 md:py-24">
        {/* TEXT — right column in RTL (first in DOM) */}
        <motion.div
          variants={container}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="text-right"
        >
          {/* Eyebrow */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">
              مركز هبة الطبي للبصريات
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="mt-6 font-extrabold leading-[1.1] tracking-tight text-ink"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
          >
            <span className="block">رؤية أوضح،</span>
            <span className="block">إطلالة أرقى.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={item}
            className="mt-6 max-w-xl text-lg leading-relaxed text-gray-600"
          >
            نظارات طبية وشمسية من أرقى البراندات العالمية، وفحص نظر شامل — في نابلس وحوارة.
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
            <span>براندات عالمية</span>
            <Dot />
            <span>إصدارات محدودة</span>
            <Dot />
            <span>فحص نظر شامل</span>
          </motion.div>
        </motion.div>

        {/* IMAGE — left column in RTL */}
        <div className="relative">
          {/* Floating accent shape */}
          <motion.div
            aria-hidden="true"
            className="absolute -right-6 -top-8 -z-0 h-40 w-40 rounded-full bg-yellow/20 blur-2xl"
            animate={floatAnim}
            transition={floatTrans}
          />

          {/* Image frame */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] shadow-card"
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
