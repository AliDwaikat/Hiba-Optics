import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'
import { fetchMyProfile, updateMyProfile } from '../../lib/profile'
import { Skeleton } from '../../components/Skeleton'

interface FieldErrors {
  name?: string
  phone?: string
}

function looksLikePhone(v: string): boolean {
  const digits = v.replace(/\D/g, '')
  return digits.length >= 7 && /^[\d\s+()-]+$/.test(v.trim())
}

export default function AccountProfile() {
  const { user, loading: authLoading } = useCustomerAuth()
  const { t } = useLanguage()
  const reduce = useReducedMotion()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // Load the current profile once the user is known.
  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    setLoadError(null)
    fetchMyProfile(user.id)
      .then((p) => {
        if (!active) return
        if (p) {
          setName(p.name ?? '')
          setPhone(p.phone ?? '')
          setAddress(p.address ?? '')
          setCity(p.city ?? '')
        }
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-4">
        <span className="text-sm text-gray-500">…</span>
      </main>
    )
  }

  // Not logged in → login (lightweight customer check, NOT the admin guard).
  if (!user) return <Navigate to="/account/login" replace />

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (!name.trim()) e.name = t('profile.err.name')
    if (phone.trim() && !looksLikePhone(phone)) e.phone = t('profile.err.phone')
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (saving || !user) return
    setSaveError(null)
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      await updateMyProfile(user.id, {
        name: name.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
      })
      window.clearTimeout(toastTimer.current)
      setToast(t('profile.saved'))
      toastTimer.current = window.setTimeout(() => setToast(null), 2600)
    } catch {
      setSaveError(t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'mb-1.5 block text-sm font-medium text-ink'
  const errClass = 'mt-1 text-xs'

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:px-8 sm:py-16">
      <h1 className="text-2xl font-extrabold text-ink">{t('profile.title')}</h1>
      <p className="mt-2 text-sm text-gray-600">{t('profile.subtitle')}</p>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mb-2 h-3 w-24 rounded" />
                <Skeleton className="h-11 w-full rounded-[var(--radius-sm)]" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">{t('profile.loadError')}</p>
            <p className="mt-2 text-sm text-gray-600">{loadError}</p>
          </div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-5 rounded-[var(--radius-lg)] border border-gray-200 bg-white p-6 shadow-card sm:p-8"
          >
            {/* Email — read-only, from auth */}
            <div>
              <label htmlFor="pf-email" className={labelClass}>{t('profile.email')}</label>
              <input
                id="pf-email"
                type="email"
                dir="ltr"
                value={user.email ?? ''}
                readOnly
                disabled
                className="field cursor-not-allowed bg-gray-50 text-gray-600"
              />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="pf-name" className={labelClass}>{t('profile.name')}</label>
              <input
                id="pf-name"
                type="text"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              {errors.name && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="pf-phone" className={labelClass}>{t('profile.phone')}</label>
              <input
                id="pf-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className="field text-end"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="0599 000 000"
              />
              {errors.phone && <p className={errClass} style={{ color: 'var(--color-error)' }}>{errors.phone}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="pf-address" className={labelClass}>{t('profile.address')}</label>
              <input
                id="pf-address"
                type="text"
                className="field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="pf-city" className={labelClass}>{t('profile.city')}</label>
              <input
                id="pf-city"
                type="text"
                className="field"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
              />
            </div>

            {saveError && (
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>{saveError}</p>
            )}

            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
          </motion.form>
        )}
      </div>

      {/* Success toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
          <div
            className="rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-white shadow-card"
            style={{ backgroundColor: 'var(--color-ink)' }}
          >
            {toast}
          </div>
        </div>
      )}
    </main>
  )
}
