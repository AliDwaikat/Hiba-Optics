import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, RevealGroup, RevealItem } from './Reveal'

/* Simple line icons (ink stroke, one yellow accent detail). */
function EyeExamIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function SunglassesIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="14" r="4" />
      <circle cx="17" cy="14" r="4" />
      <path d="M11 13.5h2" />
      <path d="M3.5 9.5 6 11.5" />
      <path d="M20.5 9.5 18 11.5" />
      <circle cx="15.4" cy="12.4" r="1" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function ContactLensIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="9" ry="6" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <circle cx="9.5" cy="10" r="1" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function KidsGlassesIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="7" cy="15" r="3.4" />
      <circle cx="17" cy="15" r="3.4" />
      <path d="M10.4 15h3.2" />
      <path d="M3.6 13 5 11.6" />
      <path d="M20.4 13 19 11.6" />
      <path className="fill-yellow" stroke="none" d="M12 3l.9 1.9 2.1.3-1.5 1.5.36 2.1L12 7.8l-1.86 1 .36-2.1L9 5.2l2.1-.3z" />
    </svg>
  )
}

interface Service {
  icon: ReactNode
  title: string
  desc: string
  to: string
}

const SERVICES: Service[] = [
  { icon: <EyeExamIcon />, title: 'فحص نظر شامل', desc: 'فحص دقيق بأحدث الأجهزة لتحديد مقاسك بدقة.', to: '/services/eye-exam' },
  { icon: <SunglassesIcon />, title: 'نظارات شمسية', desc: 'أرقى البراندات العالمية وإصدارات محدودة.', to: '/shop?category=sunglasses' },
  { icon: <ContactLensIcon />, title: 'عدسات لاصقة', desc: 'عدسات مريحة وآمنة لكل الاستخدامات.', to: '/shop?category=contact_lenses' },
  { icon: <KidsGlassesIcon />, title: 'نظارات أطفال', desc: 'إطارات مرنة ومتينة مصممة خصيصاً للأطفال.', to: '/shop?audience=kids' },
]

export default function Services() {
  return (
    <section className="bg-white py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {/* Eyebrow + heading */}
        <Reveal className="text-right">
          <div className="flex items-center justify-start gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">لماذا هبة</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">خدماتنا</h2>
        </Reveal>

        {/* Cards */}
        <RevealGroup className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:mt-12 md:grid-cols-4">
          {SERVICES.map((s) => (
            <RevealItem key={s.title}>
              <Link
                to={s.to}
                aria-label={s.title}
                className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-yellow-deep hover:shadow-lg focus-visible:outline-none focus-visible:-translate-y-1 focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-yellow-deep motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7"
              >
                <span className="text-ink transition-colors group-hover:text-yellow-deep">{s.icon}</span>
                <h3 className="mt-4 text-base font-bold text-ink sm:text-lg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-yellow-deep opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                  اعرف المزيد <span aria-hidden="true">←</span>
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
