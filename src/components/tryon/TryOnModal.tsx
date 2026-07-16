import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../../lib/language'
import TryOnEngine, { type TryOnEngineProps } from './TryOnEngine'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

interface TryOnModalProps {
  open: boolean
  onClose: () => void
  productName: string
  variantName?: string
  /** Frame identity passed straight through to the engine integration point. */
  engine: TryOnEngineProps
}

/**
 * Provider-agnostic virtual try-on modal SHELL: a centered card on desktop,
 * full-screen overlay on mobile. Header (product + variant + ×), a large
 * camera/view area that hosts the single <TryOnEngine> integration point, and a
 * footer controls strip (placeholder). Accessible: aria-modal, focus trap,
 * Esc / backdrop / × to close, body scroll locked, focus returned to the trigger
 * on close. No camera permissions are requested here — that ships with a real
 * engine wired into <TryOnEngine>.
 */
export default function TryOnModal({ open, onClose, productName, variantName, engine }: TryOnModalProps) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const focusFirst = () => {
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ;(focusables[0] ?? panel).focus()
    }
    const raf = requestAnimationFrame(focusFirst)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      ;(previouslyFocused)?.focus?.()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-stretch justify-center sm:items-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 60%, transparent)' }}
            className="absolute inset-0"
          />

          {/* Panel — full-screen on mobile, centered card on sm+ */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('tryon.aria')}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.24, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-card focus:outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-[var(--radius-lg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-ink">{productName}</h2>
                {variantName && (
                  <p className="truncate text-xs text-gray-600">{variantName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('tryon.close')}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep"
              >
                <CloseGlyph />
              </button>
            </div>

            {/* Camera / view area — where the live camera + frame overlay will
                render once an engine is connected. Hosts the ONE integration
                point. Dark surface so the coming-soon motif reads well. */}
            <div className="relative min-h-[55vh] flex-1 bg-[#0F0F0F] sm:min-h-[420px]">
              <TryOnEngine {...engine} />
            </div>

            {/* Footer controls strip (placeholder for variant switch / capture). */}
            <div className="border-t border-gray-200 px-5 py-3 text-center text-xs text-gray-600">
              {t('tryon.footer')}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
