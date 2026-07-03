import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import ProductCard from '../components/ProductCard'
import {
  fetchProducts,
  type Audience,
  type Category,
  type FrameShape,
  type Product,
} from '../lib/products'

type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'long'
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
  label: string
  heading: string
  why: string
}

const FACE_OPTIONS: FaceOption[] = [
  {
    value: 'oval',
    label: 'بيضاوي',
    heading: 'إطارات تناسب وجهك البيضاوي',
    why: 'الوجه البيضاوي متوازن الملامح، لذا تناسبه معظم أنواع الإطارات.',
  },
  {
    value: 'round',
    label: 'دائري',
    heading: 'إطارات تناسب وجهك الدائري',
    why: 'الوجه الدائري تُبرز ملامحه الإطارات الزاوية التي تضيف له تحديداً وطولاً.',
  },
  {
    value: 'square',
    label: 'مربّع',
    heading: 'إطارات تناسب وجهك المربّع',
    why: 'الوجه المربّع تلطّف حِدّته الإطارات المستديرة وناعمة المنحنيات.',
  },
  {
    value: 'heart',
    label: 'قلب',
    heading: 'إطارات تناسب وجهك القلبي الشكل',
    why: 'الوجه القلبي توازنه الإطارات الأخفّ والأوسع من الأسفل.',
  },
  {
    value: 'long',
    label: 'طويل',
    heading: 'إطارات تناسب وجهك الطويل',
    why: 'الوجه الطويل تُوازن طوله الإطارات الأعمق ذات الحضور الأكبر.',
  },
]

/** Face shape → recommended frame_shapes (real optician guidance). */
const MATCH: Record<FaceShape, FrameShape[]> = {
  round: ['rectangular', 'square', 'browline', 'cat_eye'],
  square: ['round', 'oval', 'aviator', 'cat_eye'],
  oval: ['rectangular', 'square', 'round', 'aviator', 'cat_eye', 'browline', 'oval'],
  heart: ['round', 'oval', 'aviator', 'cat_eye'],
  long: ['square', 'rectangular', 'browline', 'round'],
}

const CATEGORY_OPTIONS: { value: CategoryChoice; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'sunglasses', label: 'شمسية' },
  { value: 'optical', label: 'طبية' },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'men', label: 'رجالي' },
  { value: 'women', label: 'نسائي' },
  { value: 'unisex', label: 'للجنسين' },
  { value: 'kids', label: 'أطفال' },
]

type Phase = 0 | 1 | 2 | 3 | 4

export default function Finder() {
  const reduce = useReducedMotion()

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

  // Shape match with graceful broadening when nothing fits.
  const { list, broadened } = useMemo(() => {
    const withShape = products.filter((p) => p.frame_shape)
    const inCat = (arr: Product[]) =>
      category === 'all' ? arr : arr.filter((p) => p.category === category)
    const inAud = (arr: Product[]) =>
      audience ? arr.filter((p) => p.audience === audience) : arr

    if (!face) return { list: [] as Product[], broadened: false }
    const recommended = MATCH[face]

    const matched = inAud(inCat(withShape))
      .filter((p) => recommended.includes(p.frame_shape as FrameShape))
      .sort(
        (a, b) =>
          recommended.indexOf(a.frame_shape as FrameShape) -
            recommended.indexOf(b.frame_shape as FrameShape) || a.position - b.position,
      )

    if (matched.length > 0) return { list: matched, broadened: false }

    // Broaden: all frames of the chosen category, then all frames.
    let fallback = inCat(withShape).sort((a, b) => a.position - b.position)
    if (fallback.length === 0) fallback = [...withShape].sort((a, b) => a.position - b.position)
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
          <span>
            الخطوة <span className="num">{step}</span> من <span className="num">3</span>
          </span>
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
        ← رجوع
      </button>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
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
                مكتشف الإطارات
              </span>
              <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">
                اعثر على الإطار المثالي لوجهك
              </h1>
              <p className="mx-auto mt-4 max-w-md text-gray-600">
                أجب عن ثلاثة أسئلة قصيرة ودعنا نقترح لك الإطارات التي تناسب شكل وجهك وذوقك.
              </p>
              <button
                type="button"
                onClick={() => setPhase(1)}
                className="btn btn-primary mt-8 px-10"
              >
                ابدأ
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
              <h2 className="text-2xl font-bold text-ink">ما شكل وجهك؟</h2>
              <p className="mt-2 text-sm text-gray-600">اختر الشكل الأقرب لملامح وجهك.</p>

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
                    <span className="text-sm font-medium">{o.label}</span>
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
                  غير متأكد؟
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
                      <div className="mt-3 rounded-[var(--radius)] bg-gray-100 p-4 text-sm leading-relaxed text-gray-600">
                        قف أمام المرآة وانظر إلى أعرض جزء في وجهك: إن كان الجبين أعرض ويضيق نحو الذقن
                        فوجهك <span className="text-ink">قلب</span>؛ وإن تساوى عرض الجبين والفكّين
                        بزوايا واضحة فهو <span className="text-ink">مربّع</span>؛ وإن كان العرض
                        والطول متقاربين وبانحناءات ناعمة فهو <span className="text-ink">دائري</span>؛
                        وإن كان الطول أكبر من العرض فهو <span className="text-ink">طويل</span>؛ أمّا
                        المتوازن الأطول قليلاً من عرضه فهو <span className="text-ink">بيضاوي</span>.
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
              <h2 className="text-2xl font-bold text-ink">أي نوع تفضّل؟</h2>
              <p className="mt-2 text-sm text-gray-600">اختر نوع النظارة الذي تبحث عنه.</p>

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
                    {o.label}
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
              <h2 className="text-2xl font-bold text-ink">لمن؟</h2>
              <p className="mt-2 text-sm text-gray-600">اختياري — يمكنك التخطّي.</p>

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
                    {o.label}
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
                  تخطّي ←
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
                    <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">منتجات مقترحة</h2>
                    <p className="mx-auto mt-3 max-w-lg text-gray-600">
                      لم نجد تطابقاً دقيقاً وفق اختياراتك، إليك اقتراحات من مجموعتنا.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
                      {faceOption?.heading}
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-gray-600">{faceOption?.why}</p>
                  </>
                )}
                <p className="num mt-2 text-sm text-gray-600">{list.length} إطار</p>
              </div>

              <div className="mt-8">
                {loading ? (
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="aspect-square w-full rounded-xl bg-gray-100" />
                        <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
                        <div className="mt-2 h-4 w-3/4 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                ) : list.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg text-ink">لا توجد إطارات متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                    {list.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={restart} className="btn btn-secondary">
                  أعد الاختبار
                </button>
                <Link to="/shop" className="btn btn-primary">
                  تصفّح كل النظارات
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
