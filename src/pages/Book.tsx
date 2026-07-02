import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Reveal } from '../components/home/Reveal'
import { fetchBranches, type Branch } from '../lib/branches'
import {
  createBooking,
  generateBookingNumber,
  todayISO,
  type BookingService,
} from '../lib/bookings'

const SERVICES: { value: BookingService; label: string }[] = [
  { value: 'eye_exam', label: 'فحص نظر' },
  { value: 'glasses_consult', label: 'استشارة نظارة' },
  { value: 'general', label: 'استفسار عام' },
]

const TIME_SLOTS = ['صباحاً', 'ظهراً', 'مساءً']

/* Reassurance icons */
function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-yellow-deep" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-yellow-deep" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-yellow-deep" aria-hidden="true">
      <path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H8l-4 4V5a1 1 0 0 1 1-1Z" />
      <path d="M8 9h8M8 13h5" />
    </svg>
  )
}

const REASSURANCE = [
  { icon: <EyeIcon />, text: 'فحص دقيق بأحدث الأجهزة' },
  { icon: <PinIcon />, text: 'فرعان في نابلس وحوارة' },
  { icon: <ChatIcon />, text: 'سنتواصل معك لتأكيد الموعد' },
]

interface FieldErrors {
  name?: string
  phone?: string
  branch?: string
}

export default function Book() {
  const navigate = useNavigate()

  const [branches, setBranches] = useState<Branch[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState<BookingService>('eye_exam')
  const [branchId, setBranchId] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [notes, setNotes] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchBranches()
      .then((b) => active && setBranches(b))
      .catch(() => active && setBranches([]))
    return () => {
      active = false
    }
  }, [])

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = 'الرجاء إدخال الاسم الكامل'
    const digits = phone.replace(/\D/g, '')
    if (!phone.trim() || digits.length < 7 || !/^[\d\s+()-]+$/.test(phone.trim())) {
      e.phone = 'أدخل رقم هاتف صحيح'
    }
    if (!branchId) e.branch = 'الرجاء اختيار الفرع'
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setSubmitError(null)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    const bookingNumber = generateBookingNumber()
    try {
      await createBooking({
        booking_number: bookingNumber,
        name: name.trim(),
        phone: phone.trim(),
        branch_id: branchId,
        service,
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
        notes: notes.trim() || null,
        status: 'new',
      })
      navigate('/booking-success', { state: { bookingNumber } })
    } catch {
      setSubmitError('تعذّر تأكيد الحجز، يرجى المحاولة مرة أخرى.')
      setSubmitting(false)
    }
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
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-600">احجز موعدك</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-ink sm:text-4xl">احجز فحص نظر</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            فحص دقيق بأحدث الأجهزة — اختر الفرع والوقت المناسب لك وسنتواصل لتأكيد الموعد.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* FORM — main / right */}
          <Reveal className="lg:col-span-2">
            <form onSubmit={handleSubmit} noValidate className="space-y-6 rounded-[var(--radius-lg)] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
              {/* Name */}
              <div>
                <label htmlFor="name" className={labelClass}>الاسم الكامل</label>
                <input id="name" type="text" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                {errors.name && <p className="mt-1 text-xs" style={errStyle}>{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className={labelClass}>رقم الهاتف / واتساب</label>
                <input id="phone" type="tel" inputMode="tel" dir="ltr" className="field text-right" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="0599 000 000" />
                {errors.phone && <p className="mt-1 text-xs" style={errStyle}>{errors.phone}</p>}
              </div>

              {/* Service */}
              <div>
                <span className={labelClass}>نوع الخدمة</span>
                <div className="grid grid-cols-3 gap-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setService(s.value)}
                      className={`rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition-colors ${
                        service === s.value ? 'border-yellow bg-yellow/10 text-ink' : 'border-gray-300 text-gray-600 hover:border-ink/30'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch */}
              <div>
                <label htmlFor="branch" className={labelClass}>الفرع</label>
                <select id="branch" className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">اختر الفرع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name_ar}{b.landmark_ar ? ` — ${b.landmark_ar}` : ''}
                    </option>
                  ))}
                </select>
                {errors.branch && <p className="mt-1 text-xs" style={errStyle}>{errors.branch}</p>}
              </div>

              {/* Date + time */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="date" className={labelClass}>التاريخ المفضل (اختياري)</label>
                  <input id="date" type="date" min={todayISO()} className="field" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="time" className={labelClass}>الوقت المفضل (اختياري)</label>
                  <select id="time" className="field" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)}>
                    <option value="">اختياري</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className={labelClass}>ملاحظات (اختياري)</label>
                <textarea id="notes" rows={3} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {submitError && <p className="text-sm" style={errStyle}>{submitError}</p>}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? 'جاري الحجز…' : 'تأكيد الحجز'}
              </button>
            </form>
          </Reveal>

          {/* ASIDE — reassurance */}
          <aside className="lg:col-span-1">
            <Reveal delay={0.08} className="lg:sticky lg:top-24">
              <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink">لماذا هبة؟</h2>
                <ul className="mt-4 space-y-4">
                  {REASSURANCE.map((r) => (
                    <li key={r.text} className="flex items-start gap-3 text-sm text-gray-600">
                      {r.icon}
                      <span className="leading-relaxed">{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </main>
  )
}
