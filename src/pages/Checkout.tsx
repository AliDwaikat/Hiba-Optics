import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Reveal } from '../components/home/Reveal'
import { formatPrice } from '../lib/format'
import { useCart } from '../lib/cart'
import { useLanguage } from '../lib/language'
import { fetchBranches, type Branch } from '../lib/branches'
import {
  createOrder,
  generateOrderNumber,
  type FulfillmentType,
  type OrderItemSnapshot,
} from '../lib/orders'

const CURRENCY = 'ILS'
// Flat placeholder delivery fee — confirm real fees/zones with Hiba later.
const DELIVERY_FEE = 20

function CashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-yellow-deep" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  )
}

interface FieldErrors {
  name?: string
  phone?: string
  address?: string
  city?: string
  branch?: string
}

export default function Checkout() {
  const { items, itemCount, subtotal, clear } = useCart()
  const { t, localize } = useLanguage()
  const navigate = useNavigate()

  const [branches, setBranches] = useState<Branch[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [fulfillment, setFulfillment] = useState<FulfillmentType>('delivery')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [branchId, setBranchId] = useState('')
  const [notes, setNotes] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Set once the order is placed so clearing the cart (below) doesn't trip the
  // empty-cart guard and bounce us to /shop before the success redirect lands.
  const [placed, setPlaced] = useState(false)

  useEffect(() => {
    let active = true
    fetchBranches()
      .then((b) => active && setBranches(b))
      .catch(() => active && setBranches([]))
    return () => {
      active = false
    }
  }, [])

  // Guard: nothing to check out. Skip once the order is placed — clearing the
  // cart on success empties it, and we want the /order-success redirect to win.
  if (itemCount === 0 && !placed) return <Navigate to="/shop" replace />

  const hasConsultation = items.some((i) => i.requiresConsultation)
  const deliveryFee = fulfillment === 'delivery' && subtotal > 0 ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = t('form.err.name')
    const digits = phone.replace(/\D/g, '')
    if (!phone.trim() || digits.length < 7 || !/^[\d\s+()-]+$/.test(phone.trim())) {
      e.phone = t('form.err.phone')
    }
    if (fulfillment === 'delivery') {
      if (!address.trim()) e.address = t('checkout.err.address')
      if (!city.trim()) e.city = t('checkout.err.city')
    } else if (!branchId) {
      e.branch = t('form.err.branch')
    }
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
    const snapshot: OrderItemSnapshot[] = items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId ?? null,
      name_ar: i.name_ar,
      quantity: i.quantity,
      unit_price: i.price,
      color: i.color,
      image: i.image || null,
      requiresConsultation: i.requiresConsultation,
    }))
    const orderNumber = generateOrderNumber()

    try {
      await createOrder({
        order_number: orderNumber,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        fulfillment_type: fulfillment,
        branch_id: fulfillment === 'pickup' ? branchId : null,
        address: fulfillment === 'delivery' ? address.trim() : null,
        city: fulfillment === 'delivery' ? city.trim() : null,
        items: snapshot,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        payment_method: 'cash_on_delivery',
        status: 'new',
        has_consultation_items: hasConsultation,
        notes: notes.trim() || null,
      })
      // Success = insert returned no error. We rely on the client-side
      // order_number (no read-back), since guests can't SELECT orders.
      // Mark placed BEFORE clearing so the empty-cart guard doesn't bounce to
      // /shop, then go to the confirmation page (order_number in state + query
      // param, so it survives a reload / direct share).
      setPlaced(true)
      clear()
      navigate(`/order-success?order=${encodeURIComponent(orderNumber)}`, {
        state: { orderNumber, hasConsultation },
      })
    } catch (err) {
      // Surface the raw insert error so any remaining issue stays visible.
      const e = err as { message?: string; details?: string; code?: string }
      console.error('Order insert failed:', { message: e?.message, details: e?.details, code: e?.code })
      setSubmitError(t('checkout.err.submit'))
      setSubmitting(false)
    }
  }

  const labelClass = 'mb-1.5 block text-sm font-medium text-ink'
  const errClass = 'mt-1 text-xs'

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t('checkout.title')}</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* FORM (main / right) */}
          <Reveal className="lg:col-span-2">
            <div className="space-y-6 rounded-[var(--radius-lg)] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
              {/* Name */}
              <div>
                <label htmlFor="name" className={labelClass}>{t('form.name')}</label>
                <input id="name" type="text" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                {errors.name && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className={labelClass}>{t('form.phoneWa')}</label>
                <input id="phone" type="tel" inputMode="tel" dir="ltr" className="field text-end" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="0599 000 000" />
                {errors.phone && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.phone}</p>}
              </div>

              {/* Fulfillment toggle */}
              <div>
                <span className={labelClass}>{t('checkout.fulfillment')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {([['delivery', t('checkout.delivery')], ['pickup', t('checkout.pickup')]] as const).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFulfillment(value)}
                      className={`rounded-[var(--radius)] border px-4 py-3 text-sm font-medium transition-colors ${
                        fulfillment === value ? 'border-yellow bg-yellow/10 text-ink' : 'border-gray-300 text-gray-600 hover:border-ink/30'
                      }`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery fields */}
              {fulfillment === 'delivery' && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className={labelClass}>{t('checkout.address')}</label>
                    <input id="address" type="text" className="field" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                    {errors.address && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.address}</p>}
                  </div>
                  <div>
                    <label htmlFor="city" className={labelClass}>{t('checkout.city')}</label>
                    <input id="city" type="text" className="field" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                    {errors.city && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.city}</p>}
                  </div>
                </div>
              )}

              {/* Pickup branch selector */}
              {fulfillment === 'pickup' && (
                <div>
                  <label htmlFor="branch" className={labelClass}>{t('form.chooseBranch')}</label>
                  <select id="branch" className="field" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value="">{t('form.chooseBranch')}</option>
                    {branches.map((b) => {
                      const bn = localize(b, 'name')
                      const lm = localize(b, 'landmark')
                      return (
                        <option key={b.id} value={b.id}>
                          {bn}{lm ? ` — ${lm}` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {errors.branch && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.branch}</p>}
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className={labelClass}>{t('form.notes')}</label>
                <textarea id="notes" rows={3} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {/* Payment line */}
              <div className="flex items-center gap-2 rounded-[var(--radius)] border border-gray-300 bg-cream p-3 text-sm text-ink">
                <CashIcon />
                {t('checkout.payment')}
              </div>

              {/* Consultation info */}
              {hasConsultation && (
                <div className="rounded-[var(--radius)] border border-yellow/40 bg-yellow/10 p-3 text-sm leading-relaxed text-ink">
                  {t('checkout.consultInfo')}
                </div>
              )}
            </div>
          </Reveal>

          {/* SUMMARY (aside / left) */}
          <aside className="lg:col-span-1">
            <Reveal delay={0.08} className="lg:sticky lg:top-24">
              <div className="rounded-[var(--radius-lg)] border border-gray-100 bg-cream p-6 shadow-card">
                <h2 className="text-lg font-bold text-ink">{t('checkout.summary')}</h2>

                <ul className="mt-4 space-y-3">
                  {items.map((i) => (
                    <li key={`${i.productId}-${i.variantId ?? ''}`} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-ink">
                        {localize(i, 'name')}
                        {i.color && (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            {' — '}
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-gray-300 align-middle"
                              style={{ backgroundColor: i.color.hex }}
                              aria-hidden="true"
                            />
                            {localize(i.color, 'name')}
                          </span>
                        )}
                        <span className="num text-gray-600"> × {i.quantity}</span>
                      </span>
                      {i.requiresConsultation ? (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t('cart.coordinated')}</span>
                      ) : (
                        <span className="num shrink-0 font-semibold text-ink">{formatPrice(i.price * i.quantity, CURRENCY)}</span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('checkout.subtotal')}</span>
                    <span className="num text-ink">{formatPrice(subtotal, CURRENCY)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('checkout.deliveryFee')}</span>
                    <span className="num text-ink">{formatPrice(deliveryFee, CURRENCY)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-base">
                    <span className="font-bold text-ink">{t('checkout.total')}</span>
                    <span className="num text-lg font-bold text-ink">{formatPrice(total, CURRENCY)}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="mt-4 text-sm" style={{ color: 'var(--color-error)' }}>{submitError}</p>
                )}

                <button type="submit" disabled={submitting} className="btn btn-primary mt-6 w-full">
                  {submitting ? t('checkout.submitting') : t('checkout.submit')}
                </button>
                <Link to="/cart" className="mt-3 block text-center text-sm text-gray-600 transition-colors hover:text-ink">
                  {t('checkout.backToCart')}
                </Link>
              </div>
            </Reveal>
          </aside>
        </form>
      </div>
    </main>
  )
}
