import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Favorites (wishlist) state — mirrors the cart's approach.
 * Holds an array of product IDs in React context, persisted to localStorage.
 */

interface FavoritesContextValue {
  favorites: string[]
  count: number
  toggle: (productId: string) => void
  isFavorite: (productId: string) => boolean
  remove: (productId: string) => void
  clear: () => void
}

const STORAGE_KEY = 'hiba_favorites'

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

function loadFavorites(): string[] {
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

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Ignore write failures (private mode / quota) — still works in memory.
    }
  }, [favorites])

  function toggle(productId: string) {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  function remove(productId: string) {
    setFavorites((prev) => prev.filter((id) => id !== productId))
  }

  function clear() {
    setFavorites([])
  }

  function isFavorite(productId: string) {
    return favorites.includes(productId)
  }

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, count: favorites.length, toggle, isFavorite, remove, clear }),
    [favorites],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider')
  return ctx
}
