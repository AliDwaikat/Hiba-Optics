import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'
import { format } from '../../lib/i18n'

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

        <p className="mt-6 rounded-[var(--radius-sm)] bg-gray-50 p-4 text-sm text-gray-600">
          {t('account.soon')}
        </p>

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
