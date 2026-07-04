import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NAV_ITEMS, type NavItem } from '../lib/nav'
import { useLanguage } from '../lib/language'
import { fetchBranches, type Branch } from '../lib/branches'
import { telLink, whatsappLink } from '../lib/contact'

/* Footer brand logo — on a light chip so the light-background logo reads on the
   dark footer. Falls back to the styled text wordmark if the image is missing. */
function FooterLogo() {
  const [broken, setBroken] = useState(false)
  return (
    <Link to="/" aria-label="Hiba Optics" className="inline-flex">
      {broken ? (
        <span className="font-latin text-2xl font-bold tracking-wide">
          <span className="text-yellow">Hiba</span>{' '}
          <span className="text-cream tracking-[0.2em]">OPTICS</span>
        </span>
      ) : (
        <span className="inline-flex items-center rounded-[var(--radius)] bg-white px-3 py-2">
          <img
            src="/hiba-logo.png"
            alt="Hiba Optics"
            onError={() => setBroken(true)}
            className="block h-8 w-auto"
          />
        </span>
      )}
    </Link>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v6h3v-6h2.5l.5-3H14v-1.5c0-.3.2-.5.5-.5H14Z" />
    </svg>
  )
}

export default function Footer() {
  const { lang, t, localize } = useLanguage()
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    let active = true
    fetchBranches()
      .then((data) => {
        if (active) setBranches(data)
      })
      .catch(() => {
        if (active) setBranches([]) // empty/error → render nothing rather than break
      })
    return () => {
      active = false
    }
  }, [])

  const label = (n: NavItem) => (lang === 'en' ? n.en : n.ar)
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black text-white">
      {/* Thin yellow brand line */}
      <div className="h-px w-full bg-yellow" />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand block */}
          <div>
            <FooterLogo />
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {t('footer.tagline')}
            </p>
            <div className="mt-5 flex items-center gap-4">
              <a
                href="https://www.instagram.com/hibaoptics/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-cream transition-colors hover:text-yellow"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/HibaaOptics/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-cream transition-colors hover:text-yellow"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-bold text-cream">{t('footer.quickLinks')}</h4>
            <ul className="mt-4 space-y-2.5">
              {NAV_ITEMS.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-sm text-gray-300 transition-colors hover:text-yellow">
                    {label(n)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Branches (from the database) */}
          {branches.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-cream">{t('footer.branches')}</h4>
              <ul className="mt-4 space-y-4">
                {branches.map((b) => {
                  const num = b.whatsapp || b.phone
                  const landmark = localize(b, 'landmark')
                  return (
                    <li key={b.id} className="text-sm">
                      <p className="font-semibold text-cream">{localize(b, 'name')}</p>
                      {landmark && <p className="mt-0.5 text-gray-300">{landmark}</p>}
                      {num && (
                        <a
                          href={b.whatsapp ? whatsappLink(b.whatsapp) : telLink(num)}
                          target="_blank"
                          rel="noopener noreferrer"
                          dir="ltr"
                          className="num mt-1 inline-block text-gray-300 transition-colors hover:text-yellow"
                        >
                          {num}
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-2 border-t border-gray-900 pt-6 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <span className="num">{year}</span> Hiba Optics — {t('footer.rights')}
          </p>
          <p>{t('footer.credit')}</p>
        </div>
      </div>
    </footer>
  )
}
