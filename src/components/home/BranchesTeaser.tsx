import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal, RevealGroup, RevealItem } from './Reveal'
import { fetchBranches, type Branch } from '../../lib/branches'
import { telLink, whatsappLink } from '../../lib/contact'

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}

export default function BranchesTeaser() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    fetchBranches()
      .then((data) => {
        if (active) {
          setBranches(data)
          setReady(true)
        }
      })
      .catch(() => {
        if (active) {
          setBranches([])
          setReady(true)
        }
      })
    return () => {
      active = false
    }
  }, [])

  // Hide the section gracefully while loading and on empty/error.
  if (!ready || branches.length === 0) return null

  return (
    <section className="bg-cream py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Reveal className="text-right">
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">زورونا</h2>
          <p className="mt-2 text-gray-600">فرعان لخدمتكم</p>
        </Reveal>

        <RevealGroup className="mt-10 grid gap-5 sm:gap-6 md:mt-12 md:grid-cols-2">
          {branches.map((b) => (
            <RevealItem key={b.id}>
              <div className="h-full rounded-[var(--radius-lg)] border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                <h3 className="text-xl font-bold text-ink">{b.name_ar}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {b.address_ar}
                  {b.landmark_ar ? ` — ${b.landmark_ar}` : ''}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {b.whatsapp && (
                    <a
                      href={whatsappLink(b.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <WhatsAppIcon />
                      واتساب
                    </a>
                  )}
                  {b.phone && (
                    <a href={telLink(b.phone)} className="btn btn-secondary">
                      الاتصال
                    </a>
                  )}
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <p className="mt-8 text-sm text-gray-600">
          خريطة كل فرع في{' '}
          <Link to="/branches" className="text-ink underline decoration-yellow underline-offset-4 transition-colors hover:text-yellow-deep">
            صفحة الفروع
          </Link>
        </p>
      </div>
    </section>
  )
}
