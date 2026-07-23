import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { isOwnerEmail } from '../../lib/admin'

/** Full-screen loading spinner while the session is resolving. */
function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <span
        className="h-9 w-9 animate-spin rounded-full border-2 border-gray-300 border-t-yellow"
        role="status"
        aria-label="جاري التحميل"
      />
    </div>
  )
}

/**
 * Guards /admin/* — OWNER only.
 *   - spinner while the session resolves
 *   - signed out            → /admin/login
 *   - signed in, not owner  → public home (never renders admin content)
 *   - signed in as owner     → admin
 * A session alone is not enough: the logged-in email must be the owner's.
 */
export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <AuthSpinner />
  if (!session) return <Navigate to="/admin/login" replace />
  if (!isOwnerEmail(session.user?.email)) return <Navigate to="/" replace />
  return <Outlet />
}
