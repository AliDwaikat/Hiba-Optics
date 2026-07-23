import { useLanguage } from '../../lib/language'
import { PRIMARY_WHATSAPP, whatsappLink } from '../../lib/contact'

/**
 * Props that carry the FRAME IDENTITY into the try-on engine. A real provider
 * uses these to render the correct frame + colour on the live camera feed.
 */
export interface TryOnEngineProps {
  /** Hiba product id. */
  productId: string
  /** Selected colour/variant id (null for variant-less products). */
  variantId: string | null
  /** The selected variant's primary image url (2D-overlay fallback / preview). */
  frameImage: string | null
  /** Engine-specific frame id/code/asset path (products.tryon_ref). */
  tryonRef: string | null
}

/* Branded glasses line-art (light stroke for the dark camera view). */
function GlassesMotif() {
  return (
    <svg viewBox="0 0 56 40" className="h-20 w-auto sm:h-24" fill="none" aria-hidden="true">
      <g stroke="var(--color-cream)" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="16" height="12" rx="4" />
        <rect x="34" y="10" width="16" height="12" rx="4" />
        <path d="M22 15c2-1.5 4-1.5 6 0" />
        <path d="M6 13 1.5 10" />
        <path d="M50 13 54.5 10" />
      </g>
      <path d="M18 30c5 4 15 4 20 0" stroke="var(--color-yellow)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  )
}

/** The tasteful branded "coming soon" placeholder shown until an engine exists. */
function ComingSoon() {
  const { t } = useLanguage()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <GlassesMotif />
      <h3 className="mt-6 text-lg font-bold text-white sm:text-xl">{t('tryon.soon.title')}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[rgba(255,255,255,0.72)]">
        {t('tryon.soon.desc')}
      </p>
      <a
        href={whatsappLink(PRIMARY_WHATSAPP)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.35)] px-5 py-2 text-sm font-medium text-white transition-colors hover:border-yellow hover:text-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow"
      >
        {t('tryon.soon.whatsapp')}
      </a>
    </div>
  )
}

/**
 * TryOnEngine — the SINGLE integration point for a real virtual try-on provider.
 *
 * CONNECT TRY-ON ENGINE HERE — swap the <ComingSoon /> view below for the
 * FittingBox embed / Luxottica Virtual Mirror / MediaPipe overlay. The props
 * (productId, variantId, frameImage, tryonRef) carry the frame identity the
 * engine needs to render the correct frame + colour. No camera access
 * (getUserMedia) happens until a real engine is wired in here.
 *
 * The frame identity is mirrored onto data-* attributes so it is available to
 * the future engine / for debugging without changing this signature.
 */
export default function TryOnEngine({ productId, variantId, frameImage, tryonRef }: TryOnEngineProps) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      data-tryon-product={productId}
      data-tryon-variant={variantId ?? ''}
      data-tryon-ref={tryonRef ?? ''}
      data-tryon-image={frameImage ?? ''}
    >
      {/* CONNECT TRY-ON ENGINE HERE — replace <ComingSoon /> with the provider. */}
      <ComingSoon />
    </div>
  )
}
