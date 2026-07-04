import { supabase } from '../supabase'

/**
 * Admin data layer for brands. Reads every brand and supports
 * create / update / publish-toggle / delete, plus a single-logo upload to the
 * shared public 'product-images' Storage bucket. Column names mirror the
 * Supabase `brands` table exactly — do not rename.
 */

export interface AdminBrand {
  id: string
  name_ar: string
  name_en: string
  logo_url: string | null
  position: number
  published: boolean
  created_at: string
}

/** Writable columns, in the shape the add/edit form submits. */
export interface BrandWritePayload {
  name_ar: string
  name_en: string
  logo_url: string | null
  position: number
  published: boolean
}

/** Thrown when a save hits the unique(name_en) constraint, so the UI can show a
 *  friendly message instead of the raw Postgres error. */
export class DuplicateBrandNameError extends Error {
  constructor() {
    super('duplicate name_en')
    this.name = 'DuplicateBrandNameError'
  }
}

// Postgres unique-violation SQLSTATE.
const UNIQUE_VIOLATION = '23505'

const BRAND_COLUMNS = 'id, name_ar, name_en, logo_url, position, published, created_at'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // ~5MB
const LOGO_BUCKET = 'product-images'

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_')
}

/** Every brand, ordered by position (admin sees drafts too). */
export async function fetchAdminBrands(): Promise<AdminBrand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select(BRAND_COLUMNS)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminBrand[]
}

/** Toggle a brand's published flag. Throws on error so the caller can revert. */
export async function setBrandPublished(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .update({ published: value })
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}

/** Insert a new brand; returns its id. Throws DuplicateBrandNameError on a
 *  unique(name_en) clash, otherwise a generic Error. */
export async function createBrand(payload: BrandWritePayload): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('brands')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new DuplicateBrandNameError()
    throw new Error(error.message)
  }
  return data as { id: string }
}

/** Update an existing brand by id. Throws DuplicateBrandNameError on a
 *  unique(name_en) clash, otherwise a generic Error. */
export async function updateBrand(id: string, payload: BrandWritePayload): Promise<void> {
  const { error } = await supabase
    .from('brands')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION) throw new DuplicateBrandNameError()
    throw new Error(error.message)
  }
}

/** Permanently delete a brand. Products keep existing (brand_id → null via the
 *  FK's ON DELETE SET NULL). Throws on error. */
export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from('brands').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Upload a single logo image to the shared public 'product-images' bucket and
 * return its public URL — the SAME flow the product image uploader uses.
 * Validates type + size (≤5MB). Throws an Error (Arabic message) on failure.
 */
export async function uploadBrandLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('الملف ليس صورة')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('حجم الصورة يتجاوز 5 ميغابايت')

  const path = `brands/${Date.now()}-${sanitizeFilename(file.name)}`
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw new Error('تعذّر رفع الصورة')

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
