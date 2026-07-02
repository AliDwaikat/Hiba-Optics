import { Link } from 'react-router-dom'
import { Reveal } from './Reveal'

export default function ClosingCTA() {
  return (
    <section className="relative overflow-hidden bg-black py-20 sm:py-24 md:py-28">
      {/* Subtle yellow accent flourishes */}
      <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow/10 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-44 w-44 rounded-full border-[16px] border-yellow/10" aria-hidden="true" />

      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
        <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
          جاهز لإطلالة أوضح وأناقة أرقى؟
        </h2>
        <p className="mt-4 text-lg text-gray-300">
          اكتشف مجموعتنا من أرقى البراندات، أو احجز فحص نظر شامل مع مختصينا.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link to="/shop" className="btn btn-primary">
            تسوّق الآن
          </Link>
          <Link
            to="/book"
            className="btn border border-white/40 text-white transition-colors hover:bg-white/10"
          >
            احجز فحص نظر
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
