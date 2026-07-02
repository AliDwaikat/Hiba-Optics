import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_LANG, LANG_DIR, type Lang } from './i18n'

/**
 * Lightweight language state for the bilingual shell.
 * Arabic is the default; toggling updates the document's lang/dir and the
 * visible labels that are populated. Full EN content wiring comes later.
 */
interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(DEFAULT_LANG)

  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('lang', lang)
    el.setAttribute('dir', LANG_DIR[lang])
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
