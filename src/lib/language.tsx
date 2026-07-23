import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  DEFAULT_LANG,
  LANG_DIR,
  LANG_STORAGE_KEY,
  localize as localizeField,
  translate,
  type Lang,
  type UIKey,
} from './i18n'

/**
 * Public-site language state (Arabic default). Persists the choice to
 * localStorage, mirrors lang/dir onto <html>, and exposes:
 *   - `lang`  : 'ar' | 'en'
 *   - `dir`   : 'rtl' | 'ltr'
 *   - `setLang`
 *   - `t(key)`: translate a UI string key for the current language
 *   - `localize(obj, base)`: pick a DB _ar/_en field for the current language
 */
interface LanguageContextValue {
  lang: Lang
  dir: 'rtl' | 'ltr'
  setLang: (lang: Lang) => void
  t: (key: UIKey) => string
  localize: (obj: object | null | undefined, base: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG
  try {
    const v = window.localStorage.getItem(LANG_STORAGE_KEY)
    return v === 'ar' || v === 'en' ? v : DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  function setLang(next: Lang) {
    setLangState(next)
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // Ignore write failures (private mode / quota) — language still works in memory.
    }
  }

  useEffect(() => {
    const el = document.documentElement
    el.setAttribute('lang', lang)
    el.setAttribute('dir', LANG_DIR[lang])
  }, [lang])

  const value: LanguageContextValue = {
    lang,
    dir: LANG_DIR[lang],
    setLang,
    t: (key) => translate(key, lang),
    localize: (obj, base) => localizeField(obj, base, lang),
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
