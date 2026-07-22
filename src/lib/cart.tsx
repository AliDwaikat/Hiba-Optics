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
  /** Effective UNIT price captured at add time: the color's price override if
   *  set, else the product base price (sale already applied). Line total is
   *  price × quantity. */
  price: number
  image: string
  color: CartColor | null
  /** Selected variant id (per-variant model). Optional so older/simple items
   *  still validate; color carries the variant's name_ar/hex, image its photo. */
  variantId?: string | null
  /** Selected size label. Optional/null when the color has no sizes. Part of the
   *  line identity: the same product+color in two sizes are two separate lines. */
  size?: string | null
  /** Available stock for this color+size, when tracked (sizes). null/undefined =
   *  untracked (color-level in_stock only) ⇒ no quantity cap. */
  stock?: number | null
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
  removeItem: (productId: string, variantId: string | null, size: string | null) => void
  updateQty: (productId: string, variantId: string | null, size: string | null, qty: number) => void
  clear: () => void
}

const STORAGE_KEY = 'hiba_cart'

const CartContext = createContext<CartContextValue | null>(null)

/** A cart line is identified by product id + selected variant id + selected size
 *  (each null when absent). The SAME product in the same color but a different
 *  size — or a different color — is a separate line. */
function sameLine(
  item: CartItem,
  productId: string,
  variantId: string | null,
  size: string | null,
): boolean {
  return (
    item.productId === productId &&
    (item.variantId ?? null) === variantId &&
    (item.size ?? null) === size
  )
}

/** Clamp a quantity to a tracked stock cap (>=1). Untracked stock ⇒ no cap. */
function capQty(qty: number, stock: number | null | undefined): number {
  if (stock == null) return Math.max(1, qty)
  return Math.max(1, Math.min(qty, stock))
}

/** Normalize a persisted item so older carts (no size/stock, maybe no price)
 *  don't crash: missing size ⇒ null, missing stock ⇒ null (untracked), a
 *  non-numeric price ⇒ 0. */
function normalizeItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<CartItem>
  if (typeof r.productId !== 'string') return null
  return {
    productId: r.productId,
    name_ar: r.name_ar ?? '',
    name_en: r.name_en ?? '',
    brand_ar: r.brand_ar ?? '',
    price: typeof r.price === 'number' && Number.isFinite(r.price) ? r.price : 0,
    image: r.image ?? '',
    color: r.color ?? null,
    variantId: r.variantId ?? null,
    size: r.size ?? null,
    stock: r.stock ?? null,
    quantity: typeof r.quantity === 'number' && r.quantity > 0 ? Math.floor(r.quantity) : 1,
    requiresConsultation: Boolean(r.requiresConsultation),
  }
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeItem).filter((x): x is CartItem => x !== null)
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
      const variantId = item.variantId ?? null
      const size = item.size ?? null
      const stock = item.stock ?? null
      const idx = prev.findIndex((p) => sameLine(p, item.productId, variantId, size))
      if (idx === -1) {
        // New line: cap the initial quantity to available stock.
        return [...prev, { ...item, quantity: capQty(item.quantity, stock) }]
      }
      // Existing line: add to the running quantity, capped at the latest stock.
      const next = [...prev]
      const merged = next[idx].quantity + item.quantity
      next[idx] = { ...next[idx], stock, quantity: capQty(merged, stock) }
      return next
    })
  }

  function removeItem(productId: string, variantId: string | null, size: string | null) {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, variantId, size)))
  }

  function updateQty(
    productId: string,
    variantId: string | null,
    size: string | null,
    qty: number,
  ) {
    setItems((prev) => {
      if (qty < 1) return prev.filter((p) => !sameLine(p, productId, variantId, size))
      return prev.map((p) =>
        sameLine(p, productId, variantId, size) ? { ...p, quantity: capQty(qty, p.stock) } : p,
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
