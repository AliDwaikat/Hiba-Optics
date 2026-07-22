import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ProductCard from '../ProductCard'
import { SkeletonProductGrid } from '../Skeleton'
import { useLanguage } from '../../lib/language'
import { format, type Lang, type UIKey } from '../../lib/i18n'
import {
  fetchProducts,
  type Audience,
  type Category,
  type FaceShape,
  type FrameShape,
  type Product,
} from '../../lib/products'

type CategoryChoice = Category | 'all'

/* ---- Face-shape icons (simple ink line-drawings with a yellow guide line) ---- */
function FaceIcon({ shape }: { shape: FaceShape }) {
  const outline =
    shape === 'oval' ? (
      <ellipse cx="24" cy="24" rx="13" ry="18" />
    ) : shape === 'round' ? (
      <circle cx="24" cy="24" r="16" />
    ) : shape === 'square' ? (
      <rect x="9" y="8" width="30" height="32" rx="7" />
    ) : shape === 'heart' ? (
      <path d="M9 15c0-4 5-6 8-4 3-3 8-3 8-3s5 0 8 3c3-2 8 0 8 4 0 11-8 20-16 25C17 35 9 26 9 15Z" />
    ) : (
      <ellipse cx="24" cy="24" rx="11" ry="19" />
    )
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        {outline}
      </g>
      {/* yellow measurement guide across the widest point */}
      <line
        x1="8"
        y1="22"
        x2="40"
        y2="22"
        stroke="var(--color-yellow-deep)"
        strokeWidth="1.4"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface FaceOption {
  value: FaceShape
  labelKey: UIKey
  heading: Record<Lang, string>
  why: Record<Lang, string>
}

const FACE_OPTIONS: FaceOption[] = [
  {
    value: 'oval',
    labelKey: 'finder.face.oval',
    heading: {
      ar: 'إطارات تناسب وجهك البيضاوي',
      en: 'Frames that suit your oval face',
    },
    why: {
      ar: 'الوجه البيضاوي متوازن الملامح، لذا تناسبه معظم أنواع الإطارات.',
      en: 'An oval face is well balanced, so it works with most frame styles.',
    },
  },
  {
    value: 'round',
    labelKey: 'finder.face.round',
    heading: {
      ar: 'إطارات تناسب وجهك الدائري',
      en: 'Frames that suit your round face',
    },
    why: {
      ar: 'الوجه الدائري تُبرز ملامحه الإطارات الزاوية التي تضيف له تحديداً وطولاً.',
      en: 'A round face is flattered by angular frames that add definition and length.',
    },
  },
  {
    value: 'square',
    labelKey: 'finder.face.square',
    heading: {
      ar: 'إطارات تناسب وجهك المربّع',
      en: 'Frames that suit your square face',
    },
    why: {
      ar: 'الوجه المربّع تلطّف حِدّته الإطارات المستديرة وناعمة المنحنيات.',
      en: 'A square face is softened by round frames with gentle curves.',
    },
  },
  {
    value: 'heart',
    labelKey: 'finder.face.heart',
    heading: {
      ar: 'إطارات تناسب وجهك القلبي الشكل',
      en: 'Frames that suit your heart-shaped face',
    },
    why: {
      ar: 'الوجه القلبي توازنه الإطارات الأخفّ والأوسع من الأسفل.',
      en: 'A heart-shaped face is balanced by lighter frames that are wider at the bottom.',
    },
  },
  {
    value: 'long',
    labelKey: 'finder.face.long',
    heading: {
      ar: 'إطارات تناسب وجهك الطويل',
      en: 'Frames that suit your long face',
    },
    why: {
      ar: 'الوجه الطويل تُوازن طوله الإطارات الأعمق ذات الحضور الأكبر.',
      en: 'A long face is balanced by deeper frames with more presence.',
    },
  },
]

/** Face shape → recommended frame_shapes (real optician guidance). Used only as
 *  a FALLBACK for products that don't yet have their own face_shapes set. */
const MATCH: Record<FaceShape, FrameShape[]> = {
  round: ['rectangular', 'square', 'browline', 'cat_eye'],
  square: ['round', 'oval', 'aviator', 'cat_eye'],
  oval: ['rectangular', 'square', 'round', 'aviator', 'cat_eye', 'browline', 'oval'],
  heart: ['round', 'oval', 'aviator', 'cat_eye'],
  long: ['square', 'rectangular', 'browline', 'round'],
}

/** Does a product suit the chosen face shape? Prefer the product's own
 *  face_shapes list; for products with none set (older rows), fall back to the
 *  frame_shape → face mapping so results aren't empty during rollout. */
function suitsFace(p: Product, face: FaceShape): boolean {
  const faces = Array.isArray(p.face_shapes) ? p.face_shapes : []
  if (faces.length > 0) return faces.includes(face)
  return p.frame_shape ? MATCH[face].includes(p.frame_shape) : false
}

const CATEGORY_OPTIONS: { value: CategoryChoice; labelKey: UIKey }[] = [
  { value: 'all', labelKey: 'shop.cat.all' },
  { value: 'sunglasses', labelKey: 'shop.cat.sunglasses' },
  { value: 'optical', labelKey: 'shop.cat.optical' },
]

const AUDIENCE_OPTIONS: { value: Audience; labelKey: UIKey }[] = [
  { value: 'men', labelKey: 'shop.aud.men' },
  { value: 'women', labelKey: 'shop.aud.women' },
  { value: 'unisex', labelKey: 'shop.aud.unisex' },
  { value: 'kids', labelKey: 'shop.aud.kids' },
]

type Phase = 0 | 1 | 2 | 3 | 4

/**
 * The full Frame Finder quiz — steps, options, matching logic, and results grid.
 * Shared verbatim by the standalone /finder page and the site-wide finder modal;
 * only the outer wrapper differs, so both render the identical experience.
 */
export default function FinderQuiz({ wrapperClassName }: { wrapperClassName?: string }) {
  const reduce = useReducedMotion()
  const { t, lang } = useLanguage()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [phase, setPhase] = useState<Phase>(0)
  const [face, setFace] = useState<FaceShape | null>(null)
  const [category, setCategory] = useState<CategoryChoice>('all')
  const [audience, setAudience] = useState<Audience | null>(null)
  const [showTip, setShowTip] = useState(false)

  useEffect(() => {
    let active = true
    fetchProducts({})
      .then((data) => {
        if (!active) return
        setProducts(data)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setProducts([])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const faceOption = FACE_OPTIONS.find((f) => f.value === face) ?? null

  // Match directly on each product's face_shapes (frame_shape fallback inside
  // suitsFace), with graceful broadening when nothing fits.
  const { list, broadened } = useMemo(() => {
    const inCat = (arr: Product[]) =>
      category === 'all' ? arr : arr.filter((p) => p.category === category)
    const inAud = (arr: Product[]) =>
      audience ? arr.filter((p) => p.audience === audience) : arr

    if (!face) return { list: [] as Product[], broadened: false }

    const matched = inAud(inCat(products))
      .filter((p) => suitsFace(p, face))
      // Products with an explicit face_shapes match rank ahead of frame_shape
      // fallbacks; ties keep the catalog order.
      .sort((a, b) => {
        const aExplicit = (a.face_shapes?.length ?? 0) > 0 ? 0 : 1
        const bExplicit = (b.face_shapes?.length ?? 0) > 0 ? 0 : 1
        return aExplicit - bExplicit || a.position - b.position
      })

    if (matched.length > 0) return { list: matched, broadened: false }

    // Broaden: all products of the chosen category, then the whole catalog.
    let fallback = inCat(products).sort((a, b) => a.position - b.position)
    if (fallback.length === 0) fallback = [...products].sort((a, b) => a.position - b.position)
    return { list: fallback, broadened: true }
  }, [products, face, category, audience])

  function restart() {
    setFace(null)
    setCategory('all')
    setAudience(null)
    setShowTip(false)
    setPhase(0)
  }

  // Motion: subtle fade + slide; instant under reduced motion.
  const variants = {
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduce ? 0 : -12 },
  }
  const transition = { duration: reduce ? 0 : 0.28, ease: [0.4, 0, 0.2, 1] as const }

  const optionBtn =
    'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-gray-300 bg-white p-4 text-ink transition-colors hover:border-yellow-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep'
  const choiceBtn =
    'rounded-full border border-gray-300 px-6 py-3 text-base text-ink transition-colors hover:border-yellow-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep'

  function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="num">{format(t('finder.step'), { n: step, total: 3 })}</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <motion.div
            className="h-full rounded-full bg-yellow"
            initial={false}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }

  function BackButton({ to }: { to: Phase }) {
    return (
      <button
        type="button"
        onClick={() => setPhase(to)}
        className="text-sm font-medium text-gray-600 transition-colors hover:text-ink"
      >
        <span aria-hidden="true">←</span> {t('finder.back')}
      </button>
    )
  }

  return (
    <div className={wrapperClassName ?? 'mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14'}>
      <AnimatePresence mode="wait">
        {/* ---- Intro ---- */}
        {phase === 0 && (
          <motion.div
            key="intro"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="text-center"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-yellow-deep">
              {t('finder.eyebrow')}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
              {t('finder.intro.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-gray-600">{t('finder.intro.desc')}</p>
            <button
              type="button"
              onClick={() => setPhase(1)}
              className="btn btn-primary mt-8 px-10"
            >
              {t('finder.start')}
            </button>
          </motion.div>
        )}

        {/* ---- Step 1 — Face shape ---- */}
        {phase === 1 && (
          <motion.div
            key="face"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ProgressBar step={1} />
            <h2 className="text-2xl font-bold text-ink">{t('finder.q1')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('finder.q1.sub')}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FACE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setFace(o.value)
                    setPhase(2)
                  }}
                  className={optionBtn}
                >
                  <FaceIcon shape={o.value} />
                  <span className="text-sm font-medium">{t(o.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* "Not sure?" tip */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowTip((v) => !v)}
                aria-expanded={showTip}
                className="text-sm font-medium text-yellow-deep transition-colors hover:text-ink"
              >
                {t('finder.notSure')}
              </button>
              <AnimatePresence initial={false}>
                {showTip && (
                  <motion.div
                    key="tip"
                    initial={{ opacity: 0, height: reduce ? 'auto' : 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: reduce ? 'auto' : 0 }}
                    transition={{ duration: reduce ? 0 : 0.25, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-[var(--radius)] bg-gray-100 p-4 text-sm leading-relaxed text-gray-600 text-start">
                      {lang === 'ar' ? (
                        <>
                          قف أمام المرآة وانظر إلى أعرض جزء في وجهك: إن كان الجبين أعرض ويضيق نحو
                          الذقن فوجهك <span className="text-ink">قلب</span>؛ وإن تساوى عرض الجبين
                          والفكّين بزوايا واضحة فهو <span className="text-ink">مربّع</span>؛ وإن كان
                          العرض والطول متقاربين وبانحناءات ناعمة فهو{' '}
                          <span className="text-ink">دائري</span>؛ وإن كان الطول أكبر من العرض فهو{' '}
                          <span className="text-ink">طويل</span>؛ أمّا المتوازن الأطول قليلاً من
                          عرضه فهو <span className="text-ink">بيضاوي</span>.
                        </>
                      ) : (
                        t('finder.tip')
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8">
              <BackButton to={0} />
            </div>
          </motion.div>
        )}

        {/* ---- Step 2 — Category ---- */}
        {phase === 2 && (
          <motion.div
            key="category"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ProgressBar step={2} />
            <h2 className="text-2xl font-bold text-ink">{t('finder.q2')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('finder.q2.sub')}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {CATEGORY_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setCategory(o.value)
                    setPhase(3)
                  }}
                  className={choiceBtn}
                >
                  {t(o.labelKey)}
                </button>
              ))}
            </div>

            <div className="mt-8">
              <BackButton to={1} />
            </div>
          </motion.div>
        )}

        {/* ---- Step 3 — Audience (optional) ---- */}
        {phase === 3 && (
          <motion.div
            key="audience"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <ProgressBar step={3} />
            <h2 className="text-2xl font-bold text-ink">{t('finder.q3')}</h2>
            <p className="mt-2 text-sm text-gray-600">{t('finder.q3.sub')}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {AUDIENCE_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setAudience(o.value)
                    setPhase(4)
                  }}
                  className={choiceBtn}
                >
                  {t(o.labelKey)}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <BackButton to={2} />
              <button
                type="button"
                onClick={() => {
                  setAudience(null)
                  setPhase(4)
                }}
                className="text-sm font-medium text-yellow-deep transition-colors hover:text-ink"
              >
                {t('finder.skip')}{' '}
                <span aria-hidden="true" className="rtl:inline ltr:hidden">←</span>
                <span aria-hidden="true" className="ltr:inline rtl:hidden">→</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ---- Results ---- */}
        {phase === 4 && (
          <motion.div
            key="results"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <div className="text-center">
              {broadened ? (
                <>
                  <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
                    {t('finder.results.suggested')}
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-gray-600">
                    {t('finder.results.broadenedNote')}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
                    {faceOption?.heading[lang]}
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-gray-600">{faceOption?.why[lang]}</p>
                </>
              )}
              <p className="num mt-2 text-sm text-gray-600">
                {format(t('finder.count'), { n: list.length })}
              </p>
            </div>

            <div className="mt-8">
              {loading ? (
                <SkeletonProductGrid count={4} />
              ) : list.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-lg text-ink">{t('finder.empty')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
                  {list.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={restart} className="btn btn-secondary">
                {t('finder.restart')}
              </button>
              <Link to="/shop" className="btn btn-primary">
                {t('finder.browseAll')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
