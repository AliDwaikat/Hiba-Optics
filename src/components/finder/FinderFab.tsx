import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../../lib/language'
import FinderQuiz from './FinderQuiz'

/* Sparkle glyph — hints at the "find your perfect match" idea. */
function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5l1.7 4.9 4.9 1.7-4.9 1.7L12 15.7l-1.7-4.9L5.4 9.1l4.9-1.7L12 2.5Z" />
      <path d="M19 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" opacity="0.85" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Site-wide floating "Find Your Frame" button (public pages only — mounted in
 * Layout, not the admin shell). Clicking it opens the shared <FinderQuiz> in an
 * accessible modal: dimmed backdrop, focus trap, Esc / backdrop / × to close,
 * body-scroll lock, and focus returned to the button on close. Never auto-opens.
 */
export default function FinderFab() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Navigating (e.g. tapping a product card in the results) closes the modal so
  // the user lands on the destination, not a stale overlay.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Lock body scroll, trap focus, wire Esc — all only while open.
  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog.
    const focusFirst = () => {
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ;(focusables[0] ?? panel).focus()
    }
    // Defer so the panel is in the DOM.
    const raf = requestAnimationFrame(focusFirst)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
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
      // Return focus to the trigger (fall back to the stored element).
      ;(buttonRef.current ?? previouslyFocused)?.focus?.()
    }
  }, [open])

  return (
    <>
      {/* Floating action button — bottom-start (right in RTL, left in LTR). */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduce ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
        whileHover={reduce ? undefined : { y: -2 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        className="fixed bottom-5 start-4 z-30 inline-flex items-center gap-2 rounded-full bg-yellow py-3 ps-4 pe-5 text-sm font-bold text-ink shadow-[0_10px_30px_-8px_rgba(22,22,22,0.5)] transition-colors hover:bg-yellow-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 sm:bottom-6 sm:start-6"
      >
        <SparkleIcon />
        {t('finder.fab')}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 55%, transparent)' }}
              className="absolute inset-0"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('finder.eyebrow')}
              tabIndex={-1}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: reduce ? 0 : 0.24, ease: [0.4, 0, 0.2, 1] }}
              className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-card focus:outline-none"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('finder.close')}
                className="absolute end-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep"
              >
                <CloseGlyph />
              </button>

              <div className="overflow-y-auto overscroll-contain">
                <FinderQuiz wrapperClassName="px-5 pb-8 pt-10 sm:px-8" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
