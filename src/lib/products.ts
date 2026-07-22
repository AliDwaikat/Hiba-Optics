import { supabase } from './supabase'

/**
 * Data layer for the Hiba Optics catalog.
 * Types mirror the Supabase columns EXACTLY — do not rename fields here.
 */

export type Category = 'sunglasses' | 'optical' | 'contact_lenses' | 'accessories'
export type Audience = 'men' | 'women' | 'unisex' | 'kids'
export type FrameShape =
  | 'round'
  | 'square'
  | 'rectangular'
  | 'aviator'
  | 'cat_eye'
  | 'oval'
  | 'browline'

/** Face shapes a frame can suit (products.face_shapes text[]) — drives the
 *  "find your frame" matcher. Kept separate from FrameShape (the frame's own
 *  geometry). */
export type FaceShape = 'round' | 'oval' | 'square' | 'heart' | 'long'

/** A single selectable color on a product (products.colors jsonb). */
export interface ProductColor {
  name_ar: string
  name_en: string
  hex: string
}

/** A single feature bullet (products.features jsonb). */
export interface ProductFeature {
  text_ar: string
  text_en: string
}

/** A single size row for a variant (variant.sizes jsonb) — a size label plus its
 *  own stock count. Absent/empty sizes ⇒ color-level availability via in_stock. */
export interface VariantSize {
  /** Free-form size label, e.g. "52", "54", or a custom string. */
  size: string
  /** Units in stock for this size (non-negative integer). */
  stock: number
}

/** A color/style variant (products.variants jsonb) — the source of truth for
 *  the product page's color switcher, gallery, and per-color stock.
 *
 *  price/show_stock/sizes are OPTIONAL and were added later; existing variants
 *  omit them. Treat missing price as null (use the product base price), missing
 *  show_stock as false, and missing sizes as [] (availability falls back to
 *  in_stock). Never break variants that predate these fields. */
export interface ProductVariant {
  id: string
  name_ar: string
  name_en: string
  hex: string
  images: string[]
  in_stock: boolean
  /** Optional per-color price override; null/absent ⇒ use the product base price. */
  price?: number | null
  /** Show exact remaining counts to customers (limited editions); absent ⇒ false. */
  show_stock?: boolean
  /** Optional per-size stock rows; absent/empty ⇒ availability via in_stock. */
  sizes?: VariantSize[]
}

export interface Brand {
  id: string
  name_ar: string
  name_en: string
  logo_url: string | null
  position: number
  published: boolean
}

export interface Product {
  id: string
  brand_id: string | null
  name_ar: string
  name_en: string
  model: string | null
  description_ar: string | null
  description_en: string | null
  category: Category
  audience: Audience
  /** Frame geometry — one of the FrameShape presets OR a free-text custom shape
   *  the owner typed (e.g. "سداسي"). Stored as plain text; presets are just the
   *  common suggestions. */
  frame_shape: string | null
  /** Face shapes this frame suits (many-to-many). Empty ⇒ fall back to
   *  frame_shape-based matching in the finder. */
  face_shapes: FaceShape[]
  price: number
  sale_price: number | null
  currency: string
  images: string[]
  colors: ProductColor[]
  features: ProductFeature[]
  variants: ProductVariant[]
  requires_consultation: boolean
  in_stock: boolean
  featured: boolean
  published: boolean
  position: number
  /** Virtual try-on: engine-specific frame id/code/asset path (null until set). */
  tryon_ref: string | null
  /** Whether virtual try-on is enabled for this product (default false). */
  tryon_enabled: boolean
}

/** A product plus its resolved brand name (from the brands join, both languages). */
export interface ProductWithBrand extends Product {
  brand_name_ar: string | null
  brand_name_en: string | null
}

/** Arabic labels for product categories (shared by the shop filters and breadcrumbs). */
export const CATEGORY_LABELS_AR: Record<Category, string> = {
  sunglasses: 'شمسية',
  optical: 'طبية',
  contact_lenses: 'عدسات لاصقة',
  accessories: 'إكسسوارات',
}

const BRAND_COLUMNS = 'id, name_ar, name_en, logo_url, position, published'

const PRODUCT_COLUMNS =
  'id, brand_id, name_ar, name_en, model, description_ar, description_en, category, audience, ' +
  'frame_shape, face_shapes, ' +
  'price, sale_price, currency, images, colors, features, variants, requires_consultation, in_stock, ' +
  'featured, published, position, tryon_ref, tryon_enabled'

/** Published brands ordered by position. */
export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select(BRAND_COLUMNS)
    .eq('published', true)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Brand[]
}

export interface BrandWithCount extends Brand {
  product_count: number
}

/** Published brands (ordered by position) each with its published-product count. */
export async function fetchBrandsWithCounts(): Promise<BrandWithCount[]> {
  const brands = await fetchBrands()

  const counts = new Map<string, number>()
  try {
    const { data, error } = await supabase
      .from('products')
      .select('brand_id')
      .eq('published', true)
    if (!error && data) {
      for (const row of data as { brand_id: string | null }[]) {
        if (row.brand_id) counts.set(row.brand_id, (counts.get(row.brand_id) ?? 0) + 1)
      }
    }
  } catch {
    // Counts are non-critical — fall back to 0 rather than hiding the brands.
  }

  return brands.map((b) => ({ ...b, product_count: counts.get(b.id) ?? 0 }))
}

export interface ProductFilters {
  brandId?: string | null
  category?: Category | null
}

/** Published products ordered by position, optionally filtered by brand and/or category (AND). */
export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('published', true)
    .order('position', { ascending: true })

  if (filters.brandId) query = query.eq('brand_id', filters.brandId)
  if (filters.category) query = query.eq('category', filters.category)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

/** Published products whose id is in the given list (order not guaranteed). */
export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('published', true)
    .in('id', ids)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

/** The first published, featured product (by position), or null. */
export async function fetchFeaturedProduct(): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('published', true)
    .eq('featured', true)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as Product) ?? null
}

/** Published, featured products ordered by position (includes variants, so the
 *  card can derive its image from variants[].images). Throws on a real error. */
export async function fetchFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('published', true)
    .eq('featured', true)
    .order('position', { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

/**
 * A single published product by id (with its Arabic brand name and features),
 * or null if not found / not published.
 */
export async function fetchProduct(id: string): Promise<ProductWithBrand | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`${PRODUCT_COLUMNS}, brands(name_ar, name_en)`)
    .eq('published', true)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const { brands, ...product } = data as unknown as Product & {
    brands:
      | { name_ar: string; name_en: string }
      | { name_ar: string; name_en: string }[]
      | null
  }
  const brandRow = Array.isArray(brands) ? brands[0] : brands
  return {
    ...product,
    features: product.features ?? [],
    variants: Array.isArray(product.variants) ? product.variants : [],
    brand_name_ar: brandRow?.name_ar ?? null,
    brand_name_en: brandRow?.name_en ?? null,
  }
}

export interface Review {
  id: string
  product_id: string
  author_name: string
  rating: number
  body: string | null
  published: boolean
}

const REVIEW_COLUMNS = 'id, product_id, author_name, rating, body, published'

/** Published reviews for a product, newest first. */
export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('published', true)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Review[]
}

/** A single published brand by id, or null. Used to resolve a product's brand name. */
export async function fetchBrandById(id: string): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .select(BRAND_COLUMNS)
    .eq('published', true)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as unknown as Brand) ?? null
}
