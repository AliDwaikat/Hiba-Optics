import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Cart state layer for Hiba Optics.
 * Holds cart items in React context, persists to localStorage, and exposes
 * derived totals. No cart page / checkout yet — this is state only.
 */

export interface CartColor {
  name_ar: string
  name_en: string
  hex: string
}

export interface CartItem {
  productId: string
  name_ar: string
  name_en: string
  brand_ar: string
  price: number
  image: string
  color: CartColor | null
  /** Selected variant id (per-variant model). Optional so older/simple items
   *  still validate; color carries the variant's name_ar/hex, image its photo. */
  variantId?: string | null
  quantity: number
  requiresConsultation: boolean
}

interface CartContextValue {
  items: CartItem[]
  /** Sum of all quantities. */
  itemCount: number
  /** Sum of price*qty for NON-consultation items only (reserve items aren't payable). */
  subtotal: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string, colorName: string | null) => void
  updateQty: (productId: string, colorName: string | null, qty: number) => void
  clear: () => void
}

const STORAGE_KEY = 'hiba_cart'

const CartContext = createContext<CartContextValue | null>(null)

/** A cart line is identified by product id + selected color name (null when no color). */
function sameLine(item: CartItem, productId: string, colorName: string | null): boolean {
  const itemColor = item.color?.name_ar ?? null
  return item.productId === productId && itemColor === colorName
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  // Persist the whole cart on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore write failures (private mode / quota) — cart still works in memory.
    }
  }, [items])

  function addItem(item: CartItem) {
    setItems((prev) => {
      const colorName = item.color?.name_ar ?? null
      const idx = prev.findIndex((p) => sameLine(p, item.productId, colorName))
      if (idx === -1) return [...prev, item]
      const next = [...prev]
      next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
      return next
    })
  }

  function removeItem(productId: string, colorName: string | null) {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, colorName)))
  }

  function updateQty(productId: string, colorName: string | null, qty: number) {
    setItems((prev) => {
      if (qty < 1) return prev.filter((p) => !sameLine(p, productId, colorName))
      return prev.map((p) =>
        sameLine(p, productId, colorName) ? { ...p, quantity: qty } : p,
      )
    })
  }

  function clear() {
    setItems([])
  }

  const itemCount = useMemo(
    () => items.reduce((n, p) => n + p.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items
        .filter((p) => !p.requiresConsultation)
        .reduce((s, p) => s + p.price * p.quantity, 0),
    [items],
  )

  const value: CartContextValue = {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQty,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
