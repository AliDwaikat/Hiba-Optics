import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

/* Login brand logo — bare on the light card; text fallback if the image fails. */
function LoginLogo() {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <span className="font-latin text-xl font-bold tracking-tight" dir="ltr">
        <span className="text-ink">Hiba</span>{' '}
        <span className="text-gray-600 tracking-[0.12em]">OPTICS</span>
      </span>
    )
  }
  return (
    <img
      src="/hiba-logo.png"
      alt="Hiba Optics"
      onError={() => setBroken(true)}
      className="mx-auto block h-10 w-auto"
    />
  )
}

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in → straight to the dashboard.
  if (!loading && session) return <Navigate to="/admin" replace />

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (submitting) return
    setError(null)
    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }
    setSubmitting(true)
    const { error: signInError } = await signIn(email.trim(), password)
    if (signInError) {
      setError('بيانات الدخول غير صحيحة')
      setSubmitting(false)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-gray-300 bg-white p-8 shadow-card">
        <div className="text-center">
          <LoginLogo />
          <p className="mt-3 text-sm text-gray-600">لوحة التحكم</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              dir="ltr"
              className="field text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              كلمة المرور
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
            {submitting ? 'جاري الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </main>
  )
}
