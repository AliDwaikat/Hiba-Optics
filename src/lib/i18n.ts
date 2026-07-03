/**
 * Bilingual foundation for the PUBLIC site of Hiba Optics.
 * Arabic ('ar') is the default and primary language; English ('en') is secondary.
 * The admin panel is intentionally Arabic-only and does NOT use this layer.
 *
 * UI strings live in the `UI` dictionary below (keyed, e.g. `hero.headline.l1`).
 * DB CONTENT (product names, branch fields, …) is NOT translated here — it has
 * its own _ar/_en columns; use `localize()` to pick the right one per language.
 */

export type Lang = 'ar' | 'en'

export const DEFAULT_LANG: Lang = 'ar'

export const LANG_DIR: Record<Lang, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}

/** localStorage key for the persisted language choice. */
export const LANG_STORAGE_KEY = 'hiba_lang'

/** Brand name in both languages. The Latin wordmark stays "Hiba Optics". */
export const BRAND = {
  ar: 'مركز هبة الطبي للبصريات',
  en: 'Hiba Optics',
  wordmark: 'Hiba Optics',
} as const

type Entry = { ar: string; en: string }

/**
 * UI interface strings (header / footer / homepage — first pass).
 * Numbers stay Western digits (0-9) in both languages.
 */
export const UI = {
  // ---- Header ----
  'header.search': { ar: 'بحث', en: 'Search' },
  'header.favorites': { ar: 'المفضلة', en: 'Favorites' },
  'header.cart': { ar: 'السلة', en: 'Cart' },
  'header.menu': { ar: 'القائمة', en: 'Menu' },
  'header.close': { ar: 'إغلاق', en: 'Close' },
  'header.whatsapp': { ar: 'تواصل عبر واتساب', en: 'Chat on WhatsApp' },
  'header.language': { ar: 'اللغة', en: 'Language' },

  // ---- Footer ----
  'footer.tagline': {
    ar: 'نظارات طبية وشمسية · فحص نظر شامل · براندات عالمية',
    en: 'Prescription & sunglasses · Comprehensive eye exams · Global brands',
  },
  'footer.quickLinks': { ar: 'روابط سريعة', en: 'Quick Links' },
  'footer.branches': { ar: 'الفروع', en: 'Branches' },
  'footer.rights': { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
  'footer.credit': { ar: 'تصميم وتطوير Zaytoun', en: 'Designed & developed by Zaytoun' },

  // ---- Shared ----
  'cta.bookExam': { ar: 'احجز فحص نظر', en: 'Book an Eye Exam' },
  'common.whyHiba': { ar: 'لماذا هبة', en: 'Why Hiba' },
  'common.learnMore': { ar: 'اعرف المزيد', en: 'Learn more' },

  // ---- Hero ----
  'hero.eyebrow': { ar: 'مركز هبة الطبي للبصريات', en: 'Hiba Optical Center' },
  'hero.headline.l1': { ar: 'رؤية أوضح،', en: 'Clearer vision,' },
  'hero.headline.l2pre': { ar: 'إطلالة ', en: 'a finer ' },
  'hero.headline.l2hl': { ar: 'أرقى', en: 'look' },
  'hero.subhead': {
    ar: 'نظارات طبية وشمسية من أرقى البراندات العالمية، وفحص نظر شامل في نابلس وحوارة.',
    en: "Prescription and sunglasses from the world's finest brands, plus comprehensive eye exams in Nablus and Huwara.",
  },
  'hero.cta.shop': { ar: 'تسوّق النظارات', en: 'Shop Eyewear' },
  'hero.trust.1': { ar: 'براندات أصلية', en: 'Authentic brands' },
  'hero.trust.2': { ar: 'فحص نظر شامل', en: 'Comprehensive eye exam' },
  'hero.trust.3': { ar: 'فرعان في نابلس وحوارة', en: 'Two branches in Nablus & Huwara' },

  // ---- Brand statement band ----
  'brandStmt.headline.pre': {
    ar: 'نؤمن أن النظارة ليست مجرّد عدسة، بل طريقتك في رؤية العالم ',
    en: "We believe glasses aren't just a lens — they're how you see the world ",
  },
  'brandStmt.headline.hl': { ar: 'بوضوح', en: 'clearly' },
  'brandStmt.support': {
    ar: 'من فحص النظر الدقيق إلى أرقى البراندات العالمية — نهتم بكل تفصيل حتى ترى وتُرى بأفضل صورة.',
    en: "From precise eye exams to the world's finest brands — we care about every detail so you see, and are seen, at your best.",
  },

  // ---- Services ----
  'services.heading': { ar: 'خدماتنا', en: 'Our Services' },
  'services.eyeExam.title': { ar: 'فحص نظر شامل', en: 'Comprehensive Eye Exam' },
  'services.eyeExam.desc': {
    ar: 'فحص دقيق بأحدث الأجهزة لتحديد مقاسك بدقة.',
    en: 'A precise exam with modern equipment to pinpoint your prescription.',
  },
  'services.sunglasses.title': { ar: 'نظارات شمسية', en: 'Sunglasses' },
  'services.sunglasses.desc': {
    ar: 'أرقى البراندات العالمية وإصدارات محدودة.',
    en: 'The finest global brands and limited editions.',
  },
  'services.contacts.title': { ar: 'عدسات لاصقة', en: 'Contact Lenses' },
  'services.contacts.desc': {
    ar: 'عدسات مريحة وآمنة لكل الاستخدامات.',
    en: 'Comfortable, safe lenses for every use.',
  },
  'services.kids.title': { ar: 'نظارات أطفال', en: "Kids' Glasses" },
  'services.kids.desc': {
    ar: 'إطارات مرنة ومتينة مصممة خصيصاً للأطفال.',
    en: 'Flexible, durable frames made just for kids.',
  },

  // ---- Branches teaser ----
  'branches.heading': { ar: 'زورونا', en: 'Visit Us' },
  'branches.sub': { ar: 'فرعان لخدمتكم', en: 'Two branches to serve you' },
  'branches.whatsapp': { ar: 'واتساب', en: 'WhatsApp' },
  'branches.call': { ar: 'الاتصال', en: 'Call' },
  'branches.map.pre': { ar: 'خريطة كل فرع في ', en: "Find each branch's map on the " },
  'branches.map.link': { ar: 'صفحة الفروع', en: 'branches page' },

  // ---- Closing CTA ----
  'closing.heading': {
    ar: 'جاهز لإطلالة أوضح وأناقة أرقى؟',
    en: 'Ready for clearer vision and finer style?',
  },
  'closing.sub': {
    ar: 'اكتشف مجموعتنا من أرقى البراندات، أو احجز فحص نظر شامل مع مختصينا.',
    en: 'Explore our collection of top brands, or book a comprehensive eye exam with our specialists.',
  },
  'closing.shop': { ar: 'تسوّق الآن', en: 'Shop Now' },
} satisfies Record<string, Entry>

export type UIKey = keyof typeof UI

/** Resolve a UI string key for the given language. */
export function translate(key: UIKey, lang: Lang): string {
  return UI[key][lang]
}

/**
 * Pick a localized DB field: `${base}_en` when lang='en' (falling back to
 * `${base}_ar` if the English value is empty), otherwise `${base}_ar`.
 * Never returns blank when the Arabic value exists.
 */
export function localize(obj: object | null | undefined, base: string, lang: Lang): string {
  if (!obj) return ''
  const rec = obj as Record<string, unknown>
  const ar = (rec[`${base}_ar`] as string | null | undefined) ?? ''
  if (lang === 'en') {
    const en = (rec[`${base}_en`] as string | null | undefined) ?? ''
    return en.trim() !== '' ? en : ar
  }
  return ar
}
