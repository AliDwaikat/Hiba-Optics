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
  requires_consultation: boolean
  in_stock: boolean
  featured: boolean
  published: boolean
  position: number
}

const BRAND_COLUMNS = 'id, name_ar, name_en, logo_url, position, published'

const PRODUCT_COLUMNS =
  'id, brand_id, name_ar, name_en, description_ar, description_en, category, audience, ' +
  'price, sale_price, currency, images, colors, requires_consultation, in_stock, ' +
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
