import { Link, useLocation } from 'react-router-dom'
import { Reveal } from '../components/home/Reveal'
import { PRIMARY_WHATSAPP, whatsappLink } from '../lib/contact'

interface SuccessState {
  bookingNumber?: string
}

function CheckIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 6-11 11L4 12" />
    </svg>
  )
}
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}

export default function BookingSuccess() {
  const location = useLocation()
  const state = (location.state ?? {}) as SuccessState
  const bookingNumber = state.bookingNumber

  // Direct visit with no booking — neutral state, no crash.
  if (!bookingNumber) {
    return (
      <main className="bg-white">
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
          <p className="text-lg text-gray-600">لا يوجد حجز لعرضه.</p>
          <Link to="/" className="btn btn-primary mt-6">العودة للرئيسية</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
        <Reveal className="rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-8 text-center shadow-card sm:p-10">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-white)' }}
          >
            <CheckIcon />
          </span>

          <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-3xl">تم استلام طلب الحجز ✓</h1>

          <p className="mt-4 text-sm text-gray-600">رقم الحجز</p>
          <p className="latin mt-1 text-2xl font-bold tracking-wide text-ink" dir="ltr">{bookingNumber}</p>

          <p className="mt-6 leading-relaxed text-gray-600">
            سنتواصل معك على الرقم الذي أدخلته لتأكيد الموعد.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={whatsappLink(PRIMARY_WHATSAPP)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full sm:w-auto"
            >
              <WhatsAppIcon />
              تواصل معنا على واتساب
            </a>
            <Link to="/" className="text-sm text-gray-600 transition-colors hover:text-ink">
              العودة للرئيسية
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  )
}
