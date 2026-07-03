import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { PRIMARY_WHATSAPP, whatsappLink } from '../lib/contact'

const waBase = whatsappLink(PRIMARY_WHATSAPP)

/* ---------- Icons (ink stroke + small yellow accent) ---------- */
function TargetIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.4" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function LensIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="9" ry="6" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <circle cx="9.5" cy="10" r="1" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function FrameIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="14" r="4" />
      <circle cx="17" cy="14" r="4" />
      <path d="M11 13.5h2" />
      <path d="M3.5 9.5 6 11.5" />
      <path d="M20.5 9.5 18 11.5" />
      <circle cx="15.4" cy="12.4" r="1" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}
function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/* ---------- Content (all copy is placeholder — Hiba to confirm) ---------- */
interface Item {
  icon: ReactNode
  title: string
}
const INCLUDES: Item[] = [
  { icon: <TargetIcon />, title: 'قياس دقيق للنظر' },
  { icon: <EyeIcon />, title: 'فحص صحة العين' },
  { icon: <LensIcon />, title: 'تحديد المقاس المناسب للعدسات' },
  { icon: <FrameIcon />, title: 'استشارة لاختيار الإطار' },
]

const STEPS: { title: string; desc: string }[] = [
  { title: 'احجز موعدك', desc: 'عبر النموذج أو واتساب، واختر الفرع الأنسب لك.' },
  { title: 'الفحص في المحل', desc: 'فحص دقيق بأحدث الأجهزة مع فريق مختص.' },
  { title: 'اختيار الإطار والعدسات', desc: 'نساعدك في اختيار ما يناسب وجهك واحتياجك.' },
]

const TRUST = ['أجهزة حديثة', 'فرعان في نابلس وحوارة', 'فريق مختص']

const FAQS: { q: string; a: string }[] = [
  { q: 'كم يستغرق الفحص؟', a: 'عادةً بين 15 و30 دقيقة تقريباً حسب الحالة — والمدة قد تختلف، وسيوضح لك الفريق التفاصيل عند الزيارة.' },
  { q: 'هل أحتاج موعداً مسبقاً؟', a: 'يُفضّل حجز موعد لتوفير وقتك، ونرحّب بك أيضاً خلال ساعات العمل.' },
  { q: 'ماذا أُحضر معي؟', a: 'إن كان لديك نظارة أو وصفة سابقة فأحضرها معك، فذلك يساعد على مقارنة النتائج.' },
]

export default function EyeExam() {
  const reduce = useReducedMotion()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Intro */}
        <Reveal className="text-right">
          <div className="flex items-center justify-start gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">خدماتنا</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl md:text-5xl">فحص نظر شامل</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-gray-600">
            فحص نظر دقيق بأحدث الأجهزة على يد فريق مختص، في فرعينا في نابلس وحوارة — لتحديد مقاسك بدقة
            واختيار ما يناسبك من إطارات وعدسات.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/book" className="btn btn-primary">احجز موعدك</Link>
            <a href={waBase} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <WhatsAppGlyph />
              استفسر عبر واتساب
            </a>
          </div>
        </Reveal>

        {/* What the exam includes */}
        <section className="mt-16 sm:mt-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">ماذا يشمل الفحص؟</h2>
          </Reveal>
          <RevealGroup className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {INCLUDES.map((it) => (
              <RevealItem key={it.title}>
                <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                  <span className="text-ink">{it.icon}</span>
                  <h3 className="mt-4 text-base font-bold leading-relaxed text-ink">{it.title}</h3>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* How the visit works */}
        <section className="mt-16 sm:mt-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">كيف تتم الزيارة؟</h2>
          </Reveal>
          <RevealGroup className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <RevealItem key={step.title}>
                <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-gray-100 bg-white p-6 shadow-card sm:p-7">
                  <span className="num flex h-10 w-10 items-center justify-center rounded-full bg-yellow text-lg font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* Trust strip */}
        <Reveal className="mt-14">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-[var(--radius-lg)] border border-gray-100 bg-cream px-6 py-5 text-center text-sm font-medium text-ink">
            {TRUST.map((t, i) => (
              <span key={t} className="inline-flex items-center gap-6">
                {i > 0 && <span className="text-yellow" aria-hidden="true">·</span>}
                {t}
              </span>
            ))}
          </div>
        </Reveal>

        {/* FAQ */}
        <section className="mt-16 sm:mt-20">
          <Reveal>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">أسئلة شائعة</h2>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-cream">
              {FAQS.map((faq, i) => {
                const open = openFaq === i
                return (
                  <div key={faq.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
                    >
                      <span className="font-semibold text-ink">{faq.q}</span>
                      <motion.span
                        className="shrink-0 text-gray-600"
                        animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronIcon />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 leading-relaxed text-gray-600">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </Reveal>
        </section>
      </div>

      {/* Closing CTA band */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-24">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow/10 blur-2xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full border-[16px] border-yellow/10" aria-hidden="true" />

        <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
          <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">احجز فحص نظرك الآن</h2>
          <p className="mt-4 text-lg text-gray-300">
            نساعدك على رؤية أوضح — احجز موعدك وسنتكفّل بالباقي.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link to="/book" className="btn btn-primary">احجز موعدك</Link>
            <a
              href={waBase}
              target="_blank"
              rel="noopener noreferrer"
              className="btn border border-white/40 text-white transition-colors hover:bg-white/10"
            >
              <WhatsAppGlyph />
              تواصل عبر واتساب
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  )
}
