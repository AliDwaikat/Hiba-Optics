import { supabase } from '../supabase'
import type { Product } from '../products'

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
  'price, sale_price, currency, images, colors, features, requires_consultation, in_stock, ' +
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
