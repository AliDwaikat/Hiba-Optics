import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import {
  BookingsIcon,
  BranchesIcon,
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  OrdersIcon,
  ProductsIcon,
  ReviewsIcon,
} from './icons'

interface NavItem {
  to: string
  label: string
  icon: (p: { className?: string }) => ReactNode
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'لوحة التحكم', icon: DashboardIcon, end: true },
  { to: '/admin/products', label: 'المنتجات', icon: ProductsIcon },
  { to: '/admin/orders', label: 'الطلبات', icon: OrdersIcon },
  { to: '/admin/bookings', label: 'الحجوزات', icon: BookingsIcon },
  { to: '/admin/reviews', label: 'التقييمات', icon: ReviewsIcon },
  { to: '/admin/branches', label: 'الفروع', icon: BranchesIcon },
]

function Wordmark() {
  return (
    <span className="font-latin text-lg font-bold tracking-tight" dir="ltr">
      <span className="text-ink">Hiba</span>{' '}
      <span className="text-gray-600 tracking-[0.12em]">OPTICS</span>
    </span>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ink text-white [&_svg]:text-yellow'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-ink'
              }`
            }
          >
            <Icon className="shrink-0" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const active = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
  const pageTitle = active?.label ?? 'لوحة التحكم'

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-gray-100 text-ink">
      {/* Sidebar — right edge in RTL */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-gray-300 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-gray-300 px-5">
          <Wordmark />
        </div>
        <SidebarNav />
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-300 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="القائمة"
              className="text-ink md:hidden"
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg font-bold text-ink">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden text-sm text-gray-600 sm:inline" dir="ltr">
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-gray-100"
            >
              <LogoutIcon />
              تسجيل الخروج
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden md:hidden ${drawerOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
          className={`absolute inset-0 transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-300 px-5">
            <Wordmark />
            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="إغلاق" className="text-ink">
              <CloseIcon />
            </button>
          </div>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
        </aside>
      </div>
    </div>
  )
}
