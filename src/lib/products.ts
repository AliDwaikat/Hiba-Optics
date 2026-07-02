import { supabase } from './supabase'

/**
 * Data layer for the Hiba Optics catalog.
 * Types mirror the Supabase columns EXACTLY — do not rename fields here.
 */

export type Category = 'sunglasses' | 'optical' | 'contact_lenses' | 'accessories'
export type Audience = 'men' | 'women' | 'unisex' | 'kids'

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
  description_ar: string | null
  description_en: string | null
  category: Category
  audience: Audience
  price: number
  sale_price: number | null
  currency: string
  images: string[]
  colors: ProductColor[]
  features: ProductFeature[]
  requires_consultation: boolean
  in_stock: boolean
  featured: boolean
  published: boolean
  position: number
}

/** A product plus its resolved Arabic brand name (from the brands join). */
export interface ProductWithBrand extends Product {
  brand_name_ar: string | null
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
  'id, brand_id, name_ar, name_en, description_ar, description_en, category, audience, ' +
  'price, sale_price, currency, images, colors, features, requires_consultation, in_stock, ' +
  'featured, published, position'

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

/**
 * A single published product by id (with its Arabic brand name and features),
 * or null if not found / not published.
 */
export async function fetchProduct(id: string): Promise<ProductWithBrand | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`${PRODUCT_COLUMNS}, brands(name_ar)`)
    .eq('published', true)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const { brands, ...product } = data as unknown as Product & {
    brands: { name_ar: string } | { name_ar: string }[] | null
  }
  const brandRow = Array.isArray(brands) ? brands[0] : brands
  return {
    ...product,
    features: product.features ?? [],
    brand_name_ar: brandRow?.name_ar ?? null,
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
