import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCustomerAuth } from '../../lib/customerAuth'
import { useLanguage } from '../../lib/language'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Customer registration (public). On success either logs in immediately, or —
 * when email confirmation is enabled — shows a "check your email" notice.
 */
export default function AccountRegister() {
  const { session, loading, signUp } = useCustomerAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const reduce = useReducedMotion()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in → straight to the account page.
  if (!loading && session) return <Navigate to="/account" replace />

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setError(null)

    if (!name.trim()) {
      setError(t('account.err.nameRequired'))
      return
    }
    if (!email.trim()) {
      setError(t('account.err.emailRequired'))
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('account.err.emailInvalid'))
      return
    }
    if (!password) {
      setError(t('account.err.passwordRequired'))
      return
    }
    if (password.length < 6) {
      setError(t('account.err.passwordShort'))
      return
    }
    if (password !== confirm) {
      setError(t('account.err.passwordMismatch'))
      return
    }

    setSubmitting(true)
    const { error: signUpError, needsConfirmation } = await signUp(
      email.trim(),
      password,
      name.trim(),
    )
    if (signUpError) {
      setError(signUpError)
      setSubmitting(false)
      return
    }
    if (needsConfirmation) {
      setNotice(t('account.register.confirm'))
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
          <h1 className="text-2xl font-extrabold text-ink">{t('account.register.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('account.register.subtitle')}</p>
        </div>

        {notice ? (
          <p className="mt-8 rounded-[var(--radius-sm)] bg-[rgba(254,201,2,0.12)] p-4 text-center text-sm font-medium text-ink">
            {notice}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                {t('account.name')}
              </label>
              <input
                id="name"
                type="text"
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

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
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-ink">
                {t('account.confirmPassword')}
              </label>
              <input
                id="confirm"
                type="password"
                className="field"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm" style={{ color: 'var(--color-error)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full">
              {submitting ? '…' : t('account.register.submit')}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('account.register.haveAccount')}{' '}
          <Link to="/account/login" className="font-semibold text-yellow-deep hover:text-ink">
            {t('account.register.loginLink')}
          </Link>
        </p>
      </motion.div>
    </main>
  )
}
