/**
 * Bilingual scaffolding for Hiba Optics.
 * Arabic ('ar') is the default and primary language; English ('en') is secondary.
 * Real translation wiring (context/provider, routing) comes later — this file
 * establishes the shape so components can be built bilingual from day one.
 */

export type Lang = 'ar' | 'en'

export const DEFAULT_LANG: Lang = 'ar'

export const LANG_DIR: Record<Lang, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}

/** Brand name in both languages. The Latin wordmark stays "Hiba Optics". */
export const BRAND = {
  ar: 'مركز هبة الطبي للبصريات',
  en: 'Hiba Optics',
  wordmark: 'Hiba Optics',
} as const

type Dictionary = Record<string, { ar: string; en: string }>

export const strings = {
  underConstruction: { ar: 'قيد الإنشاء', en: 'Under construction' },
} satisfies Dictionary

/** Resolve a string key for the given language. */
export function t(key: keyof typeof strings, lang: Lang = DEFAULT_LANG): string {
  return strings[key][lang]
}
