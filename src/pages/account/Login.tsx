import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'

/**
 * Customer login (public). Uses the isolated customer auth — never the admin
 * guard. On success, returns to the account page.
 */
export default function AccountLogin() {
  const { session, loading, signIn } = useCustomerAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in → straight to the account page.
  if (!loading && session) return <Navigate to="/account" replace />

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setError(null)

    if (!email.trim()) {
      setError(t('account.err.emailRequired'))
      return
    }
    if (!password) {
      setError(t('account.err.passwordRequired'))
      return
    }

    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    if (signInError) {
      setError(t('account.login.error'))
      setSubmitting(false)
      return
    }
    navigate('/account', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-8">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-[var(--radius-lg)] border border-gray-200 bg-white p-8 shadow-card"
      >
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-ink">{t('account.login.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('account.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              {t('account.email')}
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              className="field text-start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              {t('account.password')}
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary w-full">
            {submitting ? '…' : t('account.login.submit')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('account.login.noAccount')}{' '}
          <Link to="/account/register" className="font-semibold text-yellow-deep hover:text-ink">
            {t('account.login.registerLink')}
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
