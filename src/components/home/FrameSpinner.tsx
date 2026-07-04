import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { useLanguage } from '../../lib/language'

export interface HeroFrame {
  id: string
  image: string
  name_ar: string
  name_en: string
}

/* Responsive ring geometry: smaller radius/cards on mobile so it fits with no
   horizontal scroll. */
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return mobile
}

/* One frame photo on a dark tile (matches Hiba's black-background photos). */
function FrameCard({
  frame,
  transform,
  width,
  height,
}: {
  frame: HeroFrame
  transform: string
  width: number
  height: number
}) {
  const { localize } = useLanguage()
  const [broken, setBroken] = useState(false)
  const name = localize(frame, 'name')
  return (
    <Link
      to={`/product/${frame.id}`}
      aria-label={name}
      className="absolute left-1/2 top-1/2"
      style={{
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        transform,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[var(--radius)] bg-[#000] shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        {broken ? (
          <span className="font-latin text-sm font-bold tracking-tight text-yellow/70" dir="ltr">
            Hiba
          </span>
        ) : (
          <img
            src={frame.image}
            alt={name}
            loading="lazy"
            draggable={false}
            onError={() => setBroken(true)}
            className="h-full w-full select-none object-contain p-2"
          />
        )}
      </div>
    </Link>
  )
}

/**
 * 3D ring carousel of featured frame photos for the hero. Pure CSS 3D transforms
 * driven by a light rAF loop (no 3D library): auto-rotates slowly, pauses on
 * hover, and can be dragged to spin. Under prefers-reduced-motion it renders a
 * static ring (no continuous spin). Each card links to its product.
 */
export default function FrameSpinner({ frames }: { frames: HeroFrame[] }) {
  const reduce = useReducedMotion()
  const mobile = useIsMobile()

  const ringRef = useRef<HTMLDivElement>(null)
  const angle = useRef(0)
  const dragging = useRef(false)
  const hovering = useRef(false)
  const moved = useRef(false)
  const lastX = useRef(0)
  const lastTs = useRef<number | null>(null)

  const count = frames.length
  const step = 360 / count
  const cardW = mobile ? 92 : 132
  const cardH = mobile ? 116 : 164
  // Radius large enough that neighbouring cards don't overlap: (w/2)/tan(step/2).
  const minRadius = (cardW / 2) / Math.tan((Math.PI * step) / 360)
  const radius = Math.round(Math.max(mobile ? 118 : 168, minRadius + 8))
  const perspective = mobile ? 720 : 1000
  const containerH = cardH + (mobile ? 80 : 120)

  function applyTransform() {
    if (ringRef.current) ringRef.current.style.transform = `rotateY(${angle.current}deg)`
  }

  // Auto-rotation (skipped under reduced motion — static ring instead).
  useEffect(() => {
    applyTransform()
    if (reduce) return
    let raf = 0
    const speed = 10 // degrees per second
    const tick = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts
      const dt = (ts - lastTs.current) / 1000
      lastTs.current = ts
      if (!dragging.current && !hovering.current) angle.current -= speed * dt
      applyTransform()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      lastTs.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, radius, count])

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    moved.current = false
    lastX.current = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    const dx = e.clientX - lastX.current
    if (Math.abs(dx) > 3) moved.current = true
    lastX.current = e.clientX
    angle.current += dx * 0.4
    applyTransform()
  }
  function endDrag(e: React.PointerEvent) {
    dragging.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
  }
  // Swallow the click that ends a drag so it doesn't navigate to a product.
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault()
      e.stopPropagation()
      moved.current = false
    }
  }

  return (
    <div className="relative flex items-center justify-center py-4">
      {/* Faint brand ring behind, echoing the line-art hero. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full border border-yellow opacity-[0.15]"
        style={{ height: containerH - 24, width: containerH - 24 }}
      />
      <div
        role="group"
        aria-label={frames[0] ? 'إطارات مميّزة' : undefined}
        onMouseEnter={() => (hovering.current = true)}
        onMouseLeave={() => (hovering.current = false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        className="relative w-full touch-pan-y select-none"
        style={{ height: containerH, perspective: `${perspective}px`, cursor: 'grab' }}
      >
        <div
          ref={ringRef}
          className="absolute inset-0"
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          {frames.map((f, i) => (
            <FrameCard
              key={`${f.id}-${i}`}
              frame={f}
              width={cardW}
              height={cardH}
              transform={`translate(-50%, -50%) rotateY(${i * step}deg) translateZ(${radius}px)`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
