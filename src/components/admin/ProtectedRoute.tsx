import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

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

/** Guards /admin/* — spinner while loading, redirect to login when signed out. */
export default function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) return <AuthSpinner />
  if (!session) return <Navigate to="/admin/login" replace />
  return <Outlet />
}
