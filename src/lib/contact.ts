/**
 * Contact helpers. The primary WhatsApp number is provisional — the footer's
 * per-branch numbers come from the database (source of truth).
 */
export const PRIMARY_WHATSAPP = '970599376779'

/** Build a wa.me link from a phone/whatsapp string (digits only). */
export function whatsappLink(num: string): string {
  return `https://wa.me/${num.replace(/\D/g, '')}`
}

/** Build a tel: link, preserving a leading +. */
export function telLink(num: string): string {
  return `tel:${num.replace(/[^\d+]/g, '')}`
}
