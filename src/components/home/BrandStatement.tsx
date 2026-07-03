import { Link } from 'react-router-dom'
import { RevealGroup, RevealItem } from './Reveal'

/**
 * Full-bleed dark brand-statement band. The <section> spans the full page width
 * (like the other homepage sections); the text stays within the normal
 * max-width. overflow-hidden clips the decorative watermark/arc so nothing
 * introduces horizontal scroll.
 */
export default function BrandStatement() {
  return (
    <section className="relative w-full overflow-hidden bg-black py-20 sm:py-28 md:py-32">
      {/* Ghost watermark — purely decorative */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <span className="font-latin text-[30vw] font-extrabold leading-none tracking-tight text-cream opacity-5" dir="ltr">
          HIBA
        </span>
      </span>

      {/* Low-key yellow arc accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-8 h-52 w-52 rounded-full border-[14px] border-yellow opacity-10"
      />

      <RevealGroup className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-8">
        {/* Eyebrow */}
        <RevealItem>
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-yellow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.2em] text-yellow">لماذا هبة</span>
          </div>
        </RevealItem>

        {/* Statement headline */}
        <RevealItem className="mt-6">
          <h2
            className="font-extrabold text-white"
            style={{ fontSize: 'clamp(30px, 5vw, 60px)', lineHeight: 1.15, letterSpacing: '-0.01em' }}
          >
            نؤمن أن النظارة ليست مجرّد عدسة، بل طريقتك في رؤية العالم{' '}
            <span className="text-yellow">بوضوح</span>.
          </h2>
        </RevealItem>

        {/* Supporting line */}
        <RevealItem className="mt-6">
          <p className="mx-auto max-w-[520px] text-[15px] leading-[1.7] text-cream opacity-80">
            من فحص النظر الدقيق إلى أرقى البراندات العالمية — نهتم بكل تفصيل حتى ترى وتُرى بأفضل صورة.
          </p>
        </RevealItem>

        {/* CTA */}
        <RevealItem className="mt-8">
          <Link
            to="/book"
            className="btn border border-cream text-cream transition-colors hover:border-yellow hover:bg-yellow hover:text-ink"
          >
            احجز فحص نظر
          </Link>
        </RevealItem>
      </RevealGroup>
    </section>
  )
}
