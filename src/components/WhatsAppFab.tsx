import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../lib/language'
import { PRIMARY_WHATSAPP, whatsappLink } from '../lib/contact'

/* WhatsApp brand glyph — solid white on the green button. */
function WhatsAppGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.02L2 22l5.1-1.33A9.9 9.9 0 1 0 12.04 2Zm5.7 14.03c-.17.49-1.02.96-1.4.99-.38.04-.74.18-2.5-.52-2.12-.83-3.46-2.99-3.56-3.13-.1-.14-.84-1.12-.84-2.14s.53-1.52.72-1.72c.19-.21.41-.26.55-.26l.39.01c.13.01.3-.04.46.36.18.42.59 1.45.64 1.55.05.1.09.22.02.36-.07.14-.11.23-.21.35-.1.12-.22.27-.31.36-.1.1-.21.21-.09.42.12.21.54.9 1.16 1.45.8.71 1.47.93 1.68 1.03.21.11.33.09.45-.05.12-.14.52-.61.66-.82.14-.2.28-.17.47-.1.19.07 1.21.58 1.42.68.21.1.35.15.4.24.05.09.05.51-.13.99Z" />
    </svg>
  )
}

/**
 * Floating WhatsApp contact button — public pages only (mounted in Layout, not
 * the admin shell). Sits in the bottom-END corner (left in RTL, right in LTR),
 * the opposite corner from the "Find Your Frame" pill (bottom-start), so the two
 * never overlap. Opens the Huwara WhatsApp chat in a new tab with a prefilled,
 * language-aware message. z-30 keeps it above content but below the header
 * drawer (z-50) and the finder modal (z-70).
 */
export default function WhatsAppFab() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()

  const href = `${whatsappLink(PRIMARY_WHATSAPP)}?text=${encodeURIComponent(t('wa.prefill'))}`

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('wa.fab')}
      initial={reduce ? false : { opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduce ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
      whileHover={reduce ? undefined : { scale: 1.06 }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      style={{ backgroundColor: '#25D366' }}
      className="fixed bottom-5 end-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_10px_30px_-8px_rgba(22,22,22,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 sm:bottom-6 sm:end-6"
    >
      <WhatsAppGlyph />
    </motion.a>
  )
}
