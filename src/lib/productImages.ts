import type { Product, ProductVariant } from './products'

/**
 * Shared image derivation so the product card and product detail page never
 * disagree about which image a product shows.
 *
 * Images live on each variant's `images` (a jsonb array of URL strings). The old
 * flat `images[]` column is kept only as a backup. Values are parsed defensively
 * because a jsonb array can come back as a real array, a JSON-stringified array
 * (e.g. '["https://…"]'), or a single URL string.
 */

/** Coerce an unknown value into a clean array of non-empty URL strings. */
export function toImageArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
  }
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return []
    // A stringified JSON array, e.g. '["https://…","https://…"]'.
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) {
          return parsed.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
        }
      } catch {
        // Not valid JSON — fall through and treat the whole string as one URL.
      }
    }
    return [s]
  }
  return []
}

/** A variant's images, parsed defensively. */
export function variantImages(variant: ProductVariant | null | undefined): string[] {
  if (!variant) return []
  return toImageArray((variant as { images?: unknown }).images)
}

/** The product's flat backup images, parsed defensively. */
function flatImages(product: Product): string[] {
  return toImageArray((product as { images?: unknown }).images)
}

/**
 * Full gallery for a (selected) variant, with graceful fallback:
 *   selected variant's images → first variant that HAS images → flat images[] → [].
 */
export function galleryImages(
  product: Product,
  selected: ProductVariant | null | undefined,
): string[] {
  const sel = variantImages(selected)
  if (sel.length) return sel
  for (const v of product.variants ?? []) {
    const imgs = variantImages(v)
    if (imgs.length) return imgs
  }
  return flatImages(product)
}

/**
 * Single representative image — used by BOTH the card and the detail page so
 * they agree:
 *   first in-stock variant's first image → first variant's first image →
 *   flat images[0] → null (caller shows the branded placeholder).
 */
export function primaryImage(product: Product): string | null {
  const variants = product.variants ?? []
  for (const v of variants) {
    if (v.in_stock) {
      const imgs = variantImages(v)
      if (imgs.length) return imgs[0]
    }
  }
  for (const v of variants) {
    const imgs = variantImages(v)
    if (imgs.length) return imgs[0]
  }
  return flatImages(product)[0] ?? null
}
