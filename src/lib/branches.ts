import { supabase } from './supabase'

/**
 * Branches data layer. Types mirror the Supabase `branches` columns exactly.
 */
export interface Branch {
  id: string
  name_ar: string
  name_en: string
  address_ar: string | null
  address_en: string | null
  landmark_ar: string | null
  landmark_en: string | null
  phone: string | null
  whatsapp: string | null
  hours_ar: string | null
  lat: number | null
  lng: number | null
  map_url: string | null
  position: number
  published: boolean
}

const BRANCH_COLUMNS =
  'id, name_ar, name_en, address_ar, address_en, landmark_ar, landmark_en, ' +
  'phone, whatsapp, hours_ar, lat, lng, map_url, position, published'

/** Published branches ordered by position. */
export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select(BRANCH_COLUMNS)
    .eq('published', true)
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Branch[]
}
