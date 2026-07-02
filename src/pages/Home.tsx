import { Link } from 'react-router-dom'
import Wordmark from '../components/Wordmark'
import { t } from '../lib/i18n'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <Wordmark />
      <p className="mt-4 text-lg text-gray-300">{t('underConstruction')}</p>

      <Link
        to="/shop"
        className="mt-6 inline-block rounded-full bg-yellow px-6 py-2 font-semibold text-ink transition-colors hover:bg-yellow-deep"
      >
        تصفّحي المتجر
      </Link>
    </main>
  )
}
