import { supabase } from '../supabase'
import type {
  Audience,
  Category,
  FaceShape,
  Product,
  ProductColor,
  ProductFeature,
  ProductVariant,
} from '../products'

/**
 * Admin data layer for the catalog. Unlike the storefront helpers in
 * ../products.ts, these read EVERY product (published or not) and support
 * mutations (flag toggles, delete). Column names mirror the Supabase
 * `products` table exactly — do not rename.
 */

/** Minimal brand shape for the admin brand filter / name lookup. */
export interface AdminBrand {
  id: string
  name_ar: string
}

const ADMIN_PRODUCT_COLUMNS =
  'id, brand_id, name_ar, name_en, description_ar, description_en, category, audience, ' +
  'price, sale_price, currency, images, colors, variants, features, requires_consultation, in_stock, ' +
  'featured, published, position'

/** Every product, ordered by position (admin sees drafts too). */
export async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_PRODUCT_COLUMNS)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Product[]
}

/** All brands (id + Arabic name) ordered by position — powers the brand filter. */
export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name_ar, position')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminBrand[]
}

/**
 * Distinct, non-empty frame_shape values already used across the catalog —
 * trimmed and de-duplicated case-insensitively (first-seen casing wins). Lets
 * the product form offer custom shapes the owner typed before as reusable
 * dropdown options, so she never has to retype them.
 */
export async function fetchUsedFrameShapes(): Promise<string[]> {
  const { data, error } = await supabase.from('products').select('frame_shape')
  if (error) throw new Error(error.message)
  const byLower = new Map<string, string>()
  for (const row of (data ?? []) as { frame_shape: string | null }[]) {
    const v = (row.frame_shape ?? '').trim()
    if (!v) continue
    const key = v.toLowerCase()
    if (!byLower.has(key)) byLower.set(key, v)
  }
  return Array.from(byLower.values())
}

/** The boolean columns the list can toggle inline. */
export type ProductFlag = 'published' | 'featured' | 'in_stock'

/** Write a single boolean flag; throws on error so the caller can revert. */
export async function setProductFlag(
  id: string,
  flag: ProductFlag,
  value: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ [flag]: value })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/** Permanently delete a product. Throws on error. */
export async function deleteAdminProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Set one boolean flag on many products at once (bulk action). Throws on error. */
export async function bulkSetProductFlag(
  ids: string[],
  flag: ProductFlag,
  value: boolean,
): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase
    .from('products')
    .update({ [flag]: value })
    .in('id', ids)

  if (error) throw new Error(error.message)
}

/** Permanently delete many products at once (bulk action). Throws on error. */
export async function bulkDeleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) throw new Error(error.message)
}

/* ---- Single-product read + writes for the add/edit form ---- */

/** A product row including the admin-only `model` column. */
export interface AdminProductRecord extends Product {
  model: string | null
}

/** The exact `products` columns the form reads and writes (includes model,
 *  frame_shape, and the per-color variants jsonb). */
const ADMIN_FORM_COLUMNS = `${ADMIN_PRODUCT_COLUMNS}, model, frame_shape, face_shapes`

/** Every writable column, in the shape the form submits. */
export interface ProductWritePayload {
  brand_id: string | null
  model: string | null
  name_ar: string
  name_en: string
  description_ar: string | null
  description_en: string | null
  category: Category
  audience: Audience
  frame_shape: string | null
  /** Face shapes this frame suits (many-to-many). */
  face_shapes: FaceShape[]
  price: number
  sale_price: number | null
  currency: string
  images: string[]
  colors: ProductColor[]
  /** Extended per-color variants (price/sizes/stock/show_stock) persisted as jsonb. */
  variants: ProductVariant[]
  features: ProductFeature[]
  requires_consultation: boolean
  in_stock: boolean
  featured: boolean
  published: boolean
  position: number
}

/** One product by id (any published state), with array fields normalized, or null. */
export async function fetchAdminProduct(id: string): Promise<AdminProductRecord | null> {
  const { data, error } = await supabase
    .from('products')
    .select(ADMIN_FORM_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const p = data as unknown as AdminProductRecord
  return {
    ...p,
    images: p.images ?? [],
    colors: p.colors ?? [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    face_shapes: Array.isArray(p.face_shapes) ? p.face_shapes : [],
    features: p.features ?? [],
  }
}

/** Insert a new product; returns its id. Throws on error. */
export async function createProduct(payload: ProductWritePayload): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data as { id: string }
}

/** Update an existing product by id. Throws on error. */
export async function updateProduct(id: string, payload: ProductWritePayload): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}
