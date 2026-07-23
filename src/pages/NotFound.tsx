import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../lib/language'

/* Branded glasses line-art (ink stroke on white, yellow "smile" accent) —
   mirrors the storefront's frame motif. */
function GlassesMotif() {
  return (
    <svg
      viewBox="0 0 56 40"
      className="h-28 w-auto sm:h-32"
      fill="none"
      role="img"
      aria-label="Hiba Optics"
    >
      <g
        stroke="var(--color-ink)"
        strokeOpacity="0.28"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="6" y="10" width="16" height="12" rx="4" />
        <rect x="34" y="10" width="16" height="12" rx="4" />
        <path d="M22 15c2-1.5 4-1.5 6 0" />
        <path d="M6 13 1.5 10" />
        <path d="M50 13 54.5 10" />
      </g>
      <path
        d="M18 30c5 4 15 4 20 0"
        stroke="var(--color-yellow)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Branded 404 — rendered inside the public Layout (header/footer stay visible),
 * so navigation keeps working. Not used for /admin routes, which have their own
 * guard/login flow.
 */
export default function NotFound() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()

  return (
    <main className="bg-white">
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <span className="num text-6xl font-extrabold tracking-tight text-yellow-deep sm:text-7xl">
            404
          </span>
          <div className="mt-4">
            <GlassesMotif />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-3xl">
            {t('notfound.title')}
          </h1>
          <p className="mt-3 max-w-md text-gray-600">{t('notfound.desc')}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="btn btn-primary">
              {t('common.backHome')}
            </Link>
            <Link to="/shop" className="btn btn-secondary">
              {t('common.browseShop')}
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
