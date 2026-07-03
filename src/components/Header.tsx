import { useEffect, useId, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useCart } from '../lib/cart'
import { useFavorites } from '../lib/favorites'
import { useLanguage } from '../lib/language'
import { NAV_ITEMS, type NavItem } from '../lib/nav'
import { PRIMARY_WHATSAPP, whatsappLink } from '../lib/contact'
import type { Lang } from '../lib/i18n'
import HeartIcon from './HeartIcon'

/* ---- Icons ---- */
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 5.73 13.83 8.1 8.1 0 0 1-9.9 1.23l-.36-.21-3.03.79.81-2.95-.24-.38A8.1 8.1 0 0 1 12.04 3.8Zm-2.6 4.03c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72s.74 2 .84 2.14c.1.14 1.44 2.3 3.56 3.13 1.76.7 2.12.56 2.5.52.38-.03 1.23-.5 1.4-.99.18-.48.18-.9.13-.99-.05-.09-.19-.14-.4-.24-.21-.1-1.23-.61-1.42-.68-.19-.07-.33-.1-.47.1-.14.21-.54.68-.66.82-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.68-1.03-.62-.55-1.04-1.24-1.16-1.45-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.36-.05-.1-.46-1.13-.64-1.55-.16-.4-.33-.35-.46-.36l-.39-.01Z" />
    </svg>
  )
}

/* ---- Logo: image with a graceful text fallback if the asset is missing ---- */
function Logo() {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <span className="font-latin text-lg font-bold tracking-tight">
        <span className="text-ink">Hiba</span>{' '}
        <span className="text-gray-600 tracking-[0.15em]">OPTICS</span>
      </span>
    )
  }
  return (
    <img
      src="/hiba-logo.png"
      alt="Hiba Optics"
      onError={() => setBroken(true)}
      className="h-10 w-auto sm:h-11"
    />
  )
}

/* ---- Header logo on a small dark chip so the yellow "Hiba" wordmark reads
   crisply against the white header (mirrors the favicon's ink-chip look). ---- */
function HeaderLogo() {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <span className="font-latin text-lg font-bold tracking-tight">
        <span className="text-ink">Hiba</span>{' '}
        <span className="text-gray-600 tracking-[0.15em]">OPTICS</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-1.5">
      <img
        src="/hiba-logo.png?v=5"
        alt="Hiba Optics"
        onError={() => setBroken(true)}
        className="block h-[54px] w-auto max-w-none"
      />
    </span>
  )
}

/* ---- Language toggle — segmented pill with a sliding yellow indicator ---- */
const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
]

function LangToggle({
  lang,
  setLang,
  className = '',
}: {
  lang: Lang
  setLang: (l: Lang) => void
  className?: string
}) {
  const reduce = useReducedMotion()
  // Unique per instance so the desktop and drawer toggles never share a layout
  // animation (both are mounted at once).
  const pillId = `lang-pill-${useId()}`

  return (
    <div
      role="group"
      aria-label="اللغة"
      className={`inline-flex items-center rounded-full bg-gray-100 p-0.5 ${className}`}
    >
      {LANG_OPTIONS.map((o) => {
        const active = lang === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setLang(o.value)}
            aria-pressed={active}
            aria-label={o.label}
            className={`relative rounded-full px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep ${
              active ? 'font-medium text-ink' : 'text-gray-600 hover:text-ink'
            }`}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-yellow"
                transition={{ duration: reduce ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function Header() {
  const { itemCount } = useCart()
  const { count: favCount } = useFavorites()
  const { lang, setLang } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const label = (n: NavItem) => (lang === 'en' ? n.en : n.ar)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const navUnderline =
    "relative py-1 text-sm tracking-wide text-ink transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-center after:bg-yellow after:transition-transform after:duration-300 after:content-['']"

  const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
    `${navUnderline} ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}`

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-gray-100 bg-white shadow-sm'
          : 'border-b border-transparent bg-cream'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:h-24 sm:px-8">
        {/* Logo — leading edge (right in RTL) */}
        <Link to="/" aria-label="Hiba Optics" className="flex items-center">
          <HeaderLogo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={desktopNavClass}>
              {label(n)}
            </NavLink>
          ))}
        </nav>

        {/* Controls — trailing edge (left in RTL) */}
        <div className="flex items-center gap-3 sm:gap-5">
          <LangToggle lang={lang} setLang={setLang} />

          {/* Icon cluster: search · favorites · cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/shop"
              aria-label="بحث"
              className="inline-flex items-center text-ink transition-colors hover:text-yellow-deep"
            >
              <SearchIcon />
            </Link>

            <Link
              to="/favorites"
              aria-label="المفضلة"
              className="relative inline-flex items-center text-ink transition-colors hover:text-yellow-deep"
            >
              <HeartIcon filled={false} />
              {favCount > 0 && (
                <span className="num absolute -end-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
                  {favCount}
                </span>
              )}
            </Link>

            <Link
              to="/cart"
              aria-label="السلة"
              className="relative inline-flex items-center text-ink transition-colors hover:text-yellow-deep"
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="num absolute -end-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="القائمة"
            className="text-ink md:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute inset-y-0 right-0 flex h-full w-4/5 max-w-xs flex-col bg-cream shadow-xl transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <Logo />
            <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="text-ink">
              <CloseIcon />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-2">
            {NAV_ITEMS.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-lg text-ink transition-colors ${
                    isActive ? 'bg-white font-bold' : 'hover:bg-white'
                  }`
                }
              >
                {label(n)}
              </NavLink>
            ))}

            {/* Favorites (not part of the main nav) */}
            <NavLink
              to="/favorites"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-3 text-lg text-ink transition-colors ${
                  isActive ? 'bg-white font-bold' : 'hover:bg-white'
                }`
              }
            >
              <span className="flex items-center gap-2">
                <HeartIcon filled={false} />
                المفضلة
              </span>
              {favCount > 0 && (
                <span className="num flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-yellow px-1 text-xs font-bold text-ink">
                  {favCount}
                </span>
              )}
            </NavLink>
          </nav>

          <div className="border-t border-gray-100 px-5 py-4">
            <LangToggle lang={lang} setLang={setLang} className="mb-4" />
            <a
              href={whatsappLink(PRIMARY_WHATSAPP)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full"
            >
              <WhatsAppIcon />
              تواصل عبر واتساب
            </a>
          </div>
        </aside>
      </div>
    </header>
  )
}
