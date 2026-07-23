import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import PageTransition from './PageTransition'
import FinderFab from './finder/FinderFab'
import WhatsAppFab from './WhatsAppFab'

/** Site shell: header + routed page content + footer on every page. */
export default function Layout() {
  const location = useLocation()
  // useOutlet() snapshots the current route element so the exiting page keeps
  // its own content during the transition (Outlet alone would swap early).
  const outlet = useOutlet()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>{outlet}</PageTransition>
      </AnimatePresence>
      <Footer />
      <FinderFab />
      <WhatsAppFab />
    </div>
  )
}
