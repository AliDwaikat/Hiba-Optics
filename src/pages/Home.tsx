import Wordmark from '../components/Wordmark'
import { t } from '../lib/i18n'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
      <Wordmark />
      <p className="mt-4 text-lg text-gray-500">{t('underConstruction')}</p>
    </main>
  )
}
