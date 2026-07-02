import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Wordmark from '../components/Wordmark'
import { t } from '../lib/i18n'
import { checkConnection } from '../lib/supabase'

// Temporary diagnostic — to be removed once the data layer is in place.
type ConnStatus =
  | { state: 'checking' }
  | { state: 'connected' }
  | { state: 'error'; message: string }

export default function Home() {
  const [conn, setConn] = useState<ConnStatus>({ state: 'checking' })

  useEffect(() => {
    let active = true
    checkConnection().then((result) => {
      if (!active) return
      setConn(result.ok ? { state: 'connected' } : { state: 'error', message: result.message })
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <Wordmark />
      <p className="mt-4 text-lg text-gray-300">{t('underConstruction')}</p>

      <Link
        to="/shop"
        className="mt-6 inline-block rounded-full bg-yellow px-6 py-2 font-semibold text-ink transition-colors hover:bg-yellow-deep"
      >
        تصفّحي المتجر
      </Link>

      {/* Temporary connection-check indicator — removed in a later step. */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center px-4">
        {conn.state === 'connected' && (
          <span className="text-sm" style={{ color: 'var(--color-success)' }}>
            متصل بقاعدة البيانات ✓
          </span>
        )}
        {conn.state === 'error' && (
          <span className="text-sm" style={{ color: 'var(--color-error)' }}>
            لا يوجد اتصال بقاعدة البيانات ✗ — {conn.message}
          </span>
        )}
      </div>
    </main>
  )
}
