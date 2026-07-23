import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useCustomerAuth } from './customerAuth'
import { useLanguage } from './language'
import {
  addFavorite,
  fetchFavoriteIds,
  mergeLocalFavorites,
  removeFavorite,
} from './favoritesDb'

/**
 * Favorites (wishlist) state with an auth-aware SOURCE:
 *   - GUEST  → localStorage ('hiba_favorites'), exactly as before.
 *   - LOGGED IN → the Supabase `favorites` table (per-user, RLS-scoped).
 *
 * On login/register, any local guest favorites are MERGED into the account and
 * the local list is cleared, so hearts made as a guest carry over seamlessly.
 * On logout, the source reverts to localStorage (now empty), so one user's
 * favorites never leak to the next guest.
 *
 * The public API (toggle/isFavorite/remove/clear/count/favorites) is unchanged;
 * `loading` is added for the /favorites page to show a skeleton while the DB
 * favorites resolve. Logged-in writes are optimistic and revert on error.
 */

interface FavoritesContextValue {
  favorites: string[]
  count: number
  loading: boolean
  toggle: (productId: string) => void
  isFavorite: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

const STORAGE_KEY = 'hiba_favorites'

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function loadLocal(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]).filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function clearLocal() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function writeLocal(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Ignore write failures (private mode / quota) — still works in memory.
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useCustomerAuth()
  const { t } = useLanguage()

  const [favorites, setFavorites] = useState<string[]>(loadLocal)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errorTimer = useRef<number | undefined>(undefined)

  function flashError() {
    window.clearTimeout(errorTimer.current)
    setError(t('fav.syncError'))
    errorTimer.current = window.setTimeout(() => setError(null), 2600)
  }
  useEffect(() => () => window.clearTimeout(errorTimer.current), [])

  // Guest favorites are persisted EXPLICITLY inside the guest mutation paths
  // below (never via a blanket effect) — so a logged-in user's DB list can never
  // be written into the shared guest localStorage slot during a logout.

  // Source switch on auth changes: guest → local; logged in → merge local then
  // load from the DB. Idempotent (merge upserts, clearLocal empties the slot).
  useEffect(() => {
    if (authLoading) return
    let active = true

    if (!user) {
      setLoading(false)
      setFavorites(loadLocal())
      return
    }

    const uid = user.id
    setLoading(true)
    ;(async () => {
      try {
        const localIds = loadLocal()
        if (localIds.length > 0) {
          await mergeLocalFavorites(uid, localIds)
          clearLocal()
        }
        const ids = await fetchFavoriteIds(uid)
        if (active) {
          setFavorites(ids)
          setLoading(false)
        }
      } catch {
        if (active) {
          setFavorites([])
          setLoading(false)
          flashError()
        }
      }
    })()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  function toggle(productId: string) {
    if (!user) {
      const next = favorites.includes(productId)
        ? favorites.filter((id) => id !== productId)
        : [...favorites, productId]
      setFavorites(next)
      writeLocal(next)
      return
    }
    const uid = user.id
    const wasFav = favorites.includes(productId)
    // Optimistic update…
    setFavorites((prev) =>
      wasFav ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
    // …then persist, reverting if the DB write fails.
    const op = wasFav ? removeFavorite(uid, productId) : addFavorite(uid, productId)
    op.catch(() => {
      setFavorites((prev) =>
        wasFav ? (prev.includes(productId) ? prev : [...prev, productId]) : prev.filter((id) => id !== productId),
      )
      flashError()
    })
  }

  function remove(productId: string) {
    if (!user) {
      const next = favorites.filter((id) => id !== productId)
      setFavorites(next)
      writeLocal(next)
      return
    }
    const uid = user.id
    if (!favorites.includes(productId)) return
    setFavorites((prev) => prev.filter((id) => id !== productId))
    removeFavorite(uid, productId).catch(() => {
      setFavorites((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
      flashError()
    })
  }

  function clear() {
    if (!user) {
      setFavorites([])
      writeLocal([])
      return
    }
    const uid = user.id
    const prevIds = favorites
    setFavorites([])
    Promise.all(prevIds.map((id) => removeFavorite(uid, id))).catch(() => {
      setFavorites(prevIds)
      flashError()
    })
  }

  function isFavorite(productId: string) {
    return favorites.includes(productId)
  }

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, count: favorites.length, loading, toggle, isFavorite, remove, clear }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [favorites, loading, user],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      {/* Subtle, transient sync-error toast (RTL/LTR aware via document dir). */}
      {error && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
          <div
            className="rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-white shadow-card"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            {error}
          </div>
        </div>
      )}
    </FavoritesContext.Provider>
  )
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}
