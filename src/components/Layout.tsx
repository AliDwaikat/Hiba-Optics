import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/** Site shell: header + routed page content + footer on every page. */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
