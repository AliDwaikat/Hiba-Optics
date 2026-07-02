import { useEffect, type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

/**
 * Wraps a routed page so it cross-fades with a subtle upward motion on
 * navigation. Rendered as the keyed child of an <AnimatePresence mode="wait">
 * in Layout. Scrolls to top as the new page mounts. Under prefers-reduced-motion
 * it becomes a minimal opacity-only fade with no transforms.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()

  // Reset scroll as the new page mounts (mode="wait" runs this after the old
  // page has exited, so it doesn't fight the exit animation).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const variants: Variants = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15, ease: 'easeOut' } },
        exit: { opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } },
      }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeOut' } },
      }

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  )
}
