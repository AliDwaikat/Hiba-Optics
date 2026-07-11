import { supabaseCustomer } from './supabaseCustomer'

/**
 * Customer favorites data layer. All calls run on the CUSTOMER supabase client
 * so the request carries the customer's JWT — the favorites RLS policy
 * (user_id = auth.uid()) then scopes every read/write to that user's own rows.
 *
 * The `favorites` table is keyed on (user_id, product_id); inserts upsert with
 * ignoreDuplicates so re-favoriting or merging never errors on the PK.
 */

/** The product_ids this user has favorited. */
export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  const { data, error } = await supabaseCustomer
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => (r as { product_id: string }).product_id)
}

/** Add one favorite (no-op if it already exists). */
export async function addFavorite(userId: string, productId: string): Promise<void> {
  const { error } = await supabaseCustomer
    .from('favorites')
    .upsert({ user_id: userId, product_id: productId }, {
      onConflict: 'user_id,product_id',
      ignoreDuplicates: true,
    })
  if (error) throw new Error(error.message)
}

/** Remove one favorite. */
export async function removeFavorite(userId: string, productId: string): Promise<void> {
  const { error } = await supabaseCustomer
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw new Error(error.message)
}

/**
 * Merge a guest's local favorites into the account on login — upsert every
 * product_id (duplicates ignored via the PK). Safe to call with an empty list.
 */
export async function mergeLocalFavorites(userId: string, productIds: string[]): Promise<void> {
  if (productIds.length === 0) return
  const rows = productIds.map((product_id) => ({ user_id: userId, product_id }))
  const { error } = await supabaseCustomer
    .from('favorites')
    .upsert(rows, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  if (error) throw new Error(error.message)
}
