/**
 * Site navigation — single source of truth shared by the header and footer.
 * Some routes may not exist yet; they are plain links for now.
 */
export interface NavItem {
  to: string
  ar: string
  en: string
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', ar: 'الرئيسية', en: 'Home' },
  { to: '/shop', ar: 'المتجر', en: 'Shop' },
  { to: '/brands', ar: 'البراندات', en: 'Brands' },
  { to: '/branches', ar: 'الفروع', en: 'Branches' },
  { to: '/book', ar: 'احجز فحص', en: 'Book Exam' },
  { to: '/contact', ar: 'تواصل', en: 'Contact' },
]
