import { supabase } from '../supabase'

/**
 * Admin data layer for branches. Reads every branch and supports
 * create / update / publish-toggle / delete. Column names mirror the Supabase
 * `branches` table exactly — do not rename.
 */

export interface AdminBranch {
  id: string
  name_ar: string
  name_en: string | null
  address_ar: string | null
  address_en: string | null
  landmark_ar: string | null
  landmark_en: string | null
  phone: string | null
  whatsapp: string | null
  lat: number | null
  lng: number | null
  hours_ar: string | null
  hours_en: string | null
  map_url: string | null
  position: number
  published: boolean
  created_at: string
}

/** Writable columns, in the shape the add/edit form submits. */
export interface BranchWritePayload {
  name_ar: string
  name_en: string | null
  address_ar: string | null
  address_en: string | null
  landmark_ar: string | null
  landmark_en: string | null
  phone: string | null
  whatsapp: string | null
  lat: number | null
  lng: number | null
  hours_ar: string | null
  hours_en: string | null
  map_url: string | null
  position: number
  published: boolean
}

const BRANCH_COLUMNS =
  'id, name_ar, name_en, address_ar, address_en, landmark_ar, landmark_en, phone, ' +
  'whatsapp, lat, lng, hours_ar, hours_en, map_url, position, published, created_at'

/** Every branch, ordered by position. */
export async function fetchAdminBranches(): Promise<AdminBranch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select(BRANCH_COLUMNS)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminBranch[]
}

/** Toggle a branch's published flag. Throws on error so the caller can revert. */
export async function setBranchPublished(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update({ published: value })
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}

/** Insert a new branch; returns its id. Throws on error. */
export async function createBranch(payload: BranchWritePayload): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('branches')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data as { id: string }
}

/** Update an existing branch by id. Throws on error. */
export async function updateBranch(id: string, payload: BranchWritePayload): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}

/** Permanently delete a branch. Throws on error. */
export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from('branches').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
