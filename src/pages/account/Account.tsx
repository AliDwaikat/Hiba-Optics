import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'
import { format } from '../../lib/i18n'
import { fetchMyProfile } from '../../lib/profile'
import { renewalStatus, type RenewalStatus } from '../../lib/renewal'
import { PRIMARY_WHATSAPP, whatsappLink } from '../../lib/contact'

/** Renewal date shown with Western digits (dd/mm/yyyy). */
function formatRenewalDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}

/**
 * "حسابي" — the customer account page. Guarded by the lightweight customer auth
 * (NOT the admin ProtectedRoute): a logged-out visitor is redirected to
 * /account/login. Demo scope — shows name + email + logout, no linked data.
 */
export default function Account() {
  const { user, displayName, loading, signOut } = useCustomerAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [signingOut, setSigningOut] = useState(false)

  // Renewal reminder — read the profile (best-effort; never blocks the page).
  const [renewal, setRenewal] = useState<{ status: RenewalStatus; date: string; note: string | null }>({
    status: 'none',
    date: '',
    note: null,
  })
  useEffect(() => {
    if (!user) return
    let active = true
    fetchMyProfile(user.id)
      .then((p) => {
        if (!active || !p) return
        setRenewal({
          status: renewalStatus(p.renewal_date),
          date: p.renewal_date ?? '',
          note: p.renewal_note,
        })
      })
      .catch(() => {
        // ignore — the reminder is a convenience, not a requirement
      })
    return () => {
      active = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  // Wait for the session to resolve (or an in-progress sign-out) before
  // deciding — avoids a redirect flash and lets sign-out land on home, not login.
  if (loading || signingOut) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
        <span className="text-sm text-gray-500">…</span>
      </main>
    )
  }

  // Not logged in → send to login (lightweight check, not the admin guard).
  if (!user) return <Navigate to="/account/login" replace />

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16 sm:px-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-8 shadow-card"
      >
        <h1 className="text-2xl font-extrabold text-ink">{t('account.account')}</h1>
        <p className="mt-2 text-gray-700">
          {format(t('account.greeting'), { name: displayName ?? '' })}
        </p>

        {/* Renewal reminder — shown only when due (overdue) or within ~30 days. */}
        {renewal.status !== 'none' && (
          <div
            className="mt-6 rounded-[var(--radius-lg)] border p-5"
            style={{
              borderColor: renewal.status === 'overdue' ? 'var(--color-error)' : 'var(--color-yellow-deep)',
              backgroundColor:
                renewal.status === 'overdue'
                  ? 'rgba(220,38,38,0.06)'
                  : 'rgba(254,201,2,0.12)',
            }}
          >
            <p className="text-base font-bold text-ink">
              <span aria-hidden="true">🔔 </span>
              {format(t('renewal.title'), { what: renewal.note?.trim() || t('renewal.default') })}
            </p>
            <p
              className="mt-1 text-sm font-medium"
              style={{ color: renewal.status === 'overdue' ? 'var(--color-error)' : 'var(--color-yellow-deep)' }}
            >
              {t(renewal.status === 'overdue' ? 'renewal.overdue' : 'renewal.upcoming')}
            </p>
            {renewal.date && (
              <p className="num mt-1 text-sm text-gray-600" dir="ltr">
                {format(t('renewal.on'), { date: formatRenewalDate(renewal.date) })}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/book" className="btn btn-primary">
                {t('renewal.book')}
              </Link>
              <a
                href={whatsappLink(PRIMARY_WHATSAPP)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary inline-flex items-center gap-2"
              >
                <WhatsAppGlyph />
                {t('header.whatsapp')}
              </a>
            </div>
          </div>
        )}

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('account.name')}
            </dt>
            <dd className="mt-1 text-ink">{displayName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('account.email')}
            </dt>
            <dd className="mt-1 text-ink" dir="ltr">
              {user.email}
            </dd>
          </div>
        </dl>

        <div className="mt-6 space-y-3">
          <Link
            to="/account/orders"
            className="flex items-center justify-between rounded-[var(--radius-sm)] border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-yellow-deep hover:bg-white"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{t('account.orders')}</span>
              <span className="mt-0.5 block text-xs text-gray-600">{t('account.ordersDesc')}</span>
            </span>
            <span aria-hidden="true" className="text-gray-400">
              <span className="rtl:inline ltr:hidden">←</span>
              <span className="ltr:inline rtl:hidden">→</span>
            </span>
          </Link>

          <Link
            to="/account/profile"
            className="flex items-center justify-between rounded-[var(--radius-sm)] border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-yellow-deep hover:bg-white"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">{t('account.profile')}</span>
              <span className="mt-0.5 block text-xs text-gray-600">{t('account.profileDesc')}</span>
            </span>
            <span aria-hidden="true" className="text-gray-400">
              <span className="rtl:inline ltr:hidden">←</span>
              <span className="ltr:inline rtl:hidden">→</span>
            </span>
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="btn btn-secondary mt-8 w-full"
        >
          {t('account.logout')}
        </button>
      </motion.div>
    </main>
  )
}
