import { supabase } from '../supabase'

/**
 * Admin data layer for reviews. Reads every review (newest first) and supports
 * create / update / publish-toggle / delete. Column names mirror the Supabase
 * `reviews` table exactly — do not rename.
 */

export interface AdminReview {
  id: string
  product_id: string
  author_name: string
  rating: number
  body: string | null
  published: boolean
  created_at: string
}

/** Minimal product shape for the selector + name lookup. */
export interface ReviewProduct {
  id: string
  name_ar: string
}

/** Writable columns, in the shape the add/edit form submits. */
export interface ReviewWritePayload {
  product_id: string
  author_name: string
  rating: number
  body: string | null
  published: boolean
}

const REVIEW_COLUMNS = 'id, product_id, author_name, rating, body, published, created_at'

/** Every review, newest first. */
export async function fetchAdminReviews(): Promise<AdminReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminReview[]
}

/** All products (id + Arabic name) — powers the product filter and selector. */
export async function fetchReviewProducts(): Promise<ReviewProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name_ar')
    .order('position', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ReviewProduct[]
}

/** Toggle a review's published flag. Throws on error so the caller can revert. */
export async function setReviewPublished(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ published: value })
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}

/** Insert a new review; returns its id. Throws on error. */
export async function createReview(payload: ReviewWritePayload): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(payload)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data as { id: string }
}

/** Update an existing review by id. Throws on error. */
export async function updateReview(id: string, payload: ReviewWritePayload): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw new Error(error.message)
}

/** Permanently delete a review. Throws on error. */
export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
