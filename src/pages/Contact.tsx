import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Reveal, RevealGroup, RevealItem } from '../components/home/Reveal'
import { PRIMARY_WHATSAPP, telLink, whatsappLink } from '../lib/contact'

const PHONE = '0599376779'
const waBase = whatsappLink(PRIMARY_WHATSAPP)

/* ---------- Icons (ink stroke + small yellow accent) ---------- */
function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 9h8M8 13h5" />
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Z" />
      <circle cx="17.5" cy="13" r="1.3" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
      <circle cx="18" cy="6" r="1.6" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" className="fill-yellow" stroke="none" />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" className="stroke-yellow" />
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

/* ---------- Info cards ---------- */
interface InfoCard {
  icon: ReactNode
  title: string
  lines: string[]
  action?: ReactNode
}

const INFO_CARDS: InfoCard[] = [
  {
    icon: <ChatIcon />,
    title: 'واتساب',
    lines: ['الأسرع للرد على استفساراتك'],
    action: (
      <a href={waBase} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-yellow-deep">
        <WhatsAppGlyph />
        راسلنا الآن
      </a>
    ),
  },
  {
    icon: <PhoneIcon />,
    title: 'اتصل بنا',
    lines: ['خلال ساعات العمل'],
    action: (
      <a href={telLink(PHONE)} dir="ltr" className="num inline-block text-sm font-semibold text-ink transition-colors hover:text-yellow-deep">
        {PHONE}
      </a>
    ),
  },
  {
    icon: <PinIcon />,
    title: 'زورونا',
    lines: ['فرعان في نابلس وحوارة'],
    action: (
      <Link to="/branches" className="text-sm font-semibold text-ink underline decoration-yellow underline-offset-4 transition-colors hover:text-yellow-deep">
        صفحة الفروع
      </Link>
    ),
  },
  {
    icon: <ClockIcon />,
    title: 'ساعات العمل',
    lines: ['السبت - الخميس', '9 صباحاً - 8 مساءً'],
  },
]

/* ---------- FAQ ---------- */
const FAQS: { q: string; a: string }[] = [
  { q: 'هل تجرون فحص نظر شامل؟', a: 'نعم، نوفر فحص نظر دقيق بأحدث الأجهزة في كلا الفرعين.' },
  { q: 'كم يستغرق تجهيز النظارة الطبية؟', a: 'غالباً من يوم إلى ثلاثة أيام حسب نوع العدسات، وسنبلغك فور جاهزيتها.' },
  { q: 'هل جميع النظارات أصلية؟', a: 'نعم، جميع منتجاتنا أصلية من البراندات العالمية المعتمدة.' },
  { q: 'هل تتوفر عدسات لاصقة؟', a: 'نعم، نوفر عدسات لاصقة طبية وتجميلية بأنواع متعددة.' },
  { q: 'هل يوجد خدمة توصيل؟', a: 'نعم، نوفر توصيل للطلبات مع الدفع عند الاستلام.' },
]

const SUBJECTS = ['استفسار عن منتج', 'حجز فحص نظر', 'استفسار عام', 'أخرى']

interface FormErrors {
  name?: string
  phone?: string
  message?: string
}

export default function Contact() {
  const reduce = useReducedMotion()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e: FormErrors = {}
    if (!name.trim()) e.name = 'الرجاء إدخال الاسم'
    if (!phone.trim()) e.phone = 'الرجاء إدخال رقم الهاتف'
    if (!message.trim()) e.message = 'الرجاء كتابة رسالتك'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    const text = `مرحباً هبة أوبتكس،\nالاسم: ${name.trim()}\nرقم الهاتف: ${phone.trim()}\nالموضوع: ${subject}\n${message.trim()}`
    window.open(`${waBase}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
  }

  const labelClass = 'mb-1.5 block text-sm font-medium text-ink'
  const errStyle = { color: 'var(--color-error)' }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Intro */}
        <Reveal className="text-right">
          <div className="flex items-center justify-start gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">تواصل معنا</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">نحن هنا لمساعدتك</h1>
          <p className="mt-3 max-w-xl text-gray-600">
            أي سؤال عن النظارات أو فحص النظر؟ راسلنا أو زُر أحد فرعينا.
          </p>
        </Reveal>

        {/* Info cards */}
        <RevealGroup className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:mt-12 md:grid-cols-4">
          {INFO_CARDS.map((card) => (
            <RevealItem key={card.title}>
              <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                <span className="text-ink">{card.icon}</span>
                <h3 className="mt-4 text-base font-bold text-ink">{card.title}</h3>
                {card.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm leading-relaxed text-gray-600">
                    {line}
                  </p>
                ))}
                {card.action && <div className="mt-4">{card.action}</div>}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Main: form + FAQ */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* FORM — right column in RTL (first in DOM) */}
          <Reveal>
            <form onSubmit={handleSubmit} noValidate className="rounded-[var(--radius-lg)] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-2xl font-extrabold text-ink">أرسل لنا رسالة</h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="name" className={labelClass}>الاسم</label>
                  <input id="name" type="text" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  {errors.name && <p className="mt-1 text-xs" style={errStyle}>{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>رقم الهاتف</label>
                  <input id="phone" type="tel" inputMode="tel" dir="ltr" className="field text-right" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="0599 000 000" />
                  {errors.phone && <p className="mt-1 text-xs" style={errStyle}>{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="subject" className={labelClass}>الموضوع</label>
                  <select id="subject" className="field" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>الرسالة</label>
                  <textarea id="message" rows={4} className="field resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />
                  {errors.message && <p className="mt-1 text-xs" style={errStyle}>{errors.message}</p>}
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  <WhatsAppGlyph />
                  إرسال عبر واتساب
                </button>
              </div>
            </form>
          </Reveal>

          {/* FAQ — left column in RTL */}
          <Reveal delay={0.08}>
            <h2 className="text-2xl font-extrabold text-ink">الأسئلة الشائعة</h2>
            <div className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-[var(--radius-lg)] border border-gray-100 bg-cream">
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

            <p className="mt-5 text-sm text-gray-600">
              لم تجد إجابتك؟{' '}
              <a href={waBase} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline decoration-yellow underline-offset-4 transition-colors hover:text-yellow-deep">
                راسلنا على واتساب
              </a>
            </p>
          </Reveal>
        </div>
      </div>
    </main>
  )
}
