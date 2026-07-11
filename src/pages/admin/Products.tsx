import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProductImagePlaceholder from '../../components/ProductImagePlaceholder'
import { formatPrice } from '../../lib/format'
import { CATEGORY_LABELS_AR, type Category, type Product } from '../../lib/products'
import {
  bulkDeleteProducts,
  bulkSetProductFlag,
  deleteAdminProduct,
  fetchAdminBrands,
  fetchAdminProducts,
  setProductFlag,
  type AdminBrand,
  type ProductFlag,
} from '../../lib/admin/products'
import { Skeleton } from '../../components/Skeleton'

type CategoryFilter = Category | 'all'

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'كل الفئات' },
  { value: 'sunglasses', label: CATEGORY_LABELS_AR.sunglasses },
  { value: 'optical', label: CATEGORY_LABELS_AR.optical },
  { value: 'contact_lenses', label: CATEGORY_LABELS_AR.contact_lenses },
  { value: 'accessories', label: CATEGORY_LABELS_AR.accessories },
]

/* ---- RTL-correct switch (knob rests on the leading/right edge when off) ---- */
function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep ${
        checked ? 'bg-ink' : 'bg-gray-300'
      } ${disabled ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'rtl:-translate-x-4 ltr:translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

/* ---- Thumbnail: first image, else the shared branded placeholder ---- */
function Thumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  const show = Boolean(src) && !broken
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gray-900">
      {show ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ProductImagePlaceholder textClassName="text-[10px]" />
      )}
    </div>
  )
}

/* ---- Delete confirmation dialog (single or bulk) ---- */
function ConfirmDialog({
  title,
  message,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="تأكيد الحذف"
    >
      <div
        onClick={busy ? undefined : onCancel}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
        className="absolute inset-0"
      />
      <div className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn w-28 text-white"
            style={{ backgroundColor: 'var(--color-error)' }}
          >
            {busy ? 'جاري الحذف…' : 'حذف'}
          </button>
          <button type="button" onClick={onCancel} disabled={busy} className="btn btn-secondary">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- Bulk-action bar button ---- */
function BulkBtn({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--radius)] border border-gray-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      style={danger ? { color: 'var(--color-error)', borderColor: 'var(--color-error)' } : undefined}
    >
      {children}
    </button>
  )
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
          <Skeleton className="hidden h-4 w-16 rounded sm:block" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export default function AdminProducts() {
  const location = useLocation()
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [brandId, setBrandId] = useState<string | 'all'>('all')

  // Inline-save + delete UI state
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)

  // Bulk multi-select state
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  function showToast(text: string, kind: 'success' | 'error') {
    window.clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // Show a one-off toast after returning from the add/edit form, then clear the
  // history state so a refresh doesn't replay it.
  useEffect(() => {
    const flash = (location.state as { flash?: string } | null)?.flash
    if (flash) {
      showToast(flash, 'success')
      window.history.replaceState({}, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([fetchAdminProducts(), fetchAdminBrands().catch(() => [] as AdminBrand[])])
      .then(([prods, brs]) => {
        if (!active) return
        setProducts(prods)
        setBrands(brs)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const brandNameById = useMemo(
    () => new Map(brands.map((b) => [b.id, b.name_ar])),
    [brands],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (brandId !== 'all' && p.brand_id !== brandId) return false
      if (q) {
        const hay = `${p.name_ar} ${p.name_en}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [products, search, category, brandId])

  async function handleToggle(product: Product, flag: ProductFlag) {
    const key = `${product.id}:${flag}`
    if (savingKeys.has(key)) return
    const next = !product[flag]

    // Optimistic update.
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [flag]: next } : p)))
    setSavingKeys((prev) => new Set(prev).add(key))

    try {
      await setProductFlag(product.id, flag, next)
      showToast('تم الحفظ', 'success')
    } catch {
      // Revert on failure.
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, [flag]: !next } : p)))
      showToast('تعذّر الحفظ، حاول مرة أخرى', 'error')
    } finally {
      setSavingKeys((prev) => {
        const n = new Set(prev)
        n.delete(key)
        return n
      })
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteAdminProduct(deleteTarget.id)
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('تم الحذف', 'success')
    } catch {
      showToast('تعذّر حذف المنتج، حاول مرة أخرى', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const saving = (id: string, flag: ProductFlag) => savingKeys.has(`${id}:${flag}`)

  /* ---- Selection (respects the current filters) ---- */
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id))
  const someFilteredSelected = filtered.some((p) => selected.has(p.id)) && !allFilteredSelected

  function toggleRow(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toggleSelectAll() {
    setSelected((prev) => {
      const n = new Set(prev)
      if (allFilteredSelected) filtered.forEach((p) => n.delete(p.id))
      else filtered.forEach((p) => n.add(p.id))
      return n
    })
  }
  const clearSelection = () => setSelected(new Set())

  /* ---- Bulk actions (operate on the selected ids via an `in` filter) ---- */
  async function runBulkFlag(flag: ProductFlag, value: boolean) {
    if (bulkBusy || selected.size === 0) return
    const ids = Array.from(selected)
    const n = ids.length
    setBulkBusy(true)
    try {
      await bulkSetProductFlag(ids, flag, value)
      // Only reflect the change after the server confirmed success.
      const idSet = new Set(ids)
      setProducts((prev) => prev.map((p) => (idSet.has(p.id) ? { ...p, [flag]: value } : p)))
      clearSelection()
      showToast(`تم تحديث ${n} منتج`, 'success')
    } catch {
      showToast('تعذّر التحديث، حاول مرة أخرى', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  async function runBulkDelete() {
    if (bulkBusy || selected.size === 0) return
    const ids = Array.from(selected)
    const n = ids.length
    setBulkBusy(true)
    try {
      await bulkDeleteProducts(ids)
      const idSet = new Set(ids)
      setProducts((prev) => prev.filter((p) => !idSet.has(p.id)))
      clearSelection()
      setBulkDeleteOpen(false)
      showToast(`تم حذف ${n} منتج`, 'success')
    } catch {
      // Keep the selection (and the dialog) so the admin can retry.
      showToast('تعذّر حذف المنتجات، حاول مرة أخرى', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">المنتجات</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{products.length} منتج</p>
          )}
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          + إضافة منتج
        </Link>
      </div>

      {/* Controls bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم…"
          aria-label="بحث"
          className="field sm:max-w-xs"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          aria-label="تصفية حسب الفئة"
          className="field sm:w-44"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          aria-label="تصفية حسب البراند"
          className="field sm:w-44"
        >
          <option value="all">كل البراندات</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-gray-300 bg-white shadow-card">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-lg text-ink">تعذّر تحميل المنتجات</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg text-ink">لا توجد منتجات — أضف أول منتج</p>
            <Link to="/admin/products/new" className="btn btn-primary mt-6">
              + إضافة منتج
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg text-ink">لا توجد نتائج مطابقة</p>
            <p className="mt-2 text-sm text-gray-600">جرّب تعديل البحث أو الفلاتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-xs text-gray-600">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected
                      }}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer align-middle"
                      style={{ accentColor: 'var(--color-yellow-deep)' }}
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">المنتج</th>
                  <th className="px-4 py-3 font-medium">الفئة</th>
                  <th className="px-4 py-3 font-medium">السعر</th>
                  <th className="px-4 py-3 text-center font-medium">منشور</th>
                  <th className="px-4 py-3 text-center font-medium">مميز</th>
                  <th className="px-4 py-3 text-center font-medium">متوفر</th>
                  <th className="px-4 py-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const brandName = p.brand_id ? brandNameById.get(p.brand_id) : undefined
                  const salePrice =
                    p.sale_price != null ? Number(p.sale_price) : null
                  const price = Number(p.price)
                  const onSale = salePrice != null && salePrice < price
                  const isSelected = selected.has(p.id)
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-100/60"
                      style={
                        isSelected
                          ? { backgroundColor: 'color-mix(in srgb, var(--color-yellow) 12%, white)' }
                          : undefined
                      }
                    >
                      {/* Select */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`تحديد: ${p.name_ar}`}
                          checked={isSelected}
                          onChange={() => toggleRow(p.id)}
                          className="h-4 w-4 cursor-pointer align-middle"
                          style={{ accentColor: 'var(--color-yellow-deep)' }}
                        />
                      </td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={p.images?.[0]} alt={p.name_ar} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{p.name_ar}</p>
                            {brandName && (
                              <p className="truncate text-xs text-gray-600">{brandName}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {CATEGORY_LABELS_AR[p.category]}
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {onSale ? (
                          <div className="flex items-center gap-2">
                            <span className="num font-semibold text-ink">
                              {formatPrice(salePrice as number, p.currency)}
                            </span>
                            <span className="num text-xs text-gray-600 line-through">
                              {formatPrice(price, p.currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="num font-semibold text-ink">
                            {formatPrice(price, p.currency)}
                          </span>
                        )}
                      </td>

                      {/* Published */}
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={p.published}
                          disabled={saving(p.id, 'published')}
                          onChange={() => handleToggle(p, 'published')}
                          label={`منشور: ${p.name_ar}`}
                        />
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={p.featured}
                          disabled={saving(p.id, 'featured')}
                          onChange={() => handleToggle(p, 'featured')}
                          label={`مميز: ${p.name_ar}`}
                        />
                      </td>

                      {/* In stock */}
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={p.in_stock}
                          disabled={saving(p.id, 'in_stock')}
                          onChange={() => handleToggle(p, 'in_stock')}
                          label={`متوفر: ${p.name_ar}`}
                        />
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="text-sm font-medium text-ink transition-colors hover:text-yellow-deep"
                          >
                            تعديل
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="text-sm font-medium transition-opacity hover:opacity-70"
                            style={{ color: 'var(--color-error)' }}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk-action bar — floats above the list while a selection exists (no
          layout shift). */}
      {selected.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          role="region"
          aria-label="إجراءات جماعية"
        >
          <div className="flex max-w-full flex-wrap items-center justify-center gap-2 overflow-x-auto rounded-[var(--radius-lg)] border border-gray-300 bg-white px-4 py-3 shadow-card">
            <span className="num whitespace-nowrap text-sm font-medium text-ink">
              تم تحديد {selected.size}
            </span>
            <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
            <BulkBtn onClick={() => runBulkFlag('published', true)} disabled={bulkBusy}>نشر</BulkBtn>
            <BulkBtn onClick={() => runBulkFlag('published', false)} disabled={bulkBusy}>إلغاء النشر</BulkBtn>
            <BulkBtn onClick={() => runBulkFlag('featured', true)} disabled={bulkBusy}>تمييز</BulkBtn>
            <BulkBtn onClick={() => runBulkFlag('featured', false)} disabled={bulkBusy}>إلغاء التمييز</BulkBtn>
            <BulkBtn onClick={() => runBulkFlag('in_stock', true)} disabled={bulkBusy}>متوفر</BulkBtn>
            <BulkBtn onClick={() => runBulkFlag('in_stock', false)} disabled={bulkBusy}>غير متوفر</BulkBtn>
            <BulkBtn onClick={() => setBulkDeleteOpen(true)} disabled={bulkBusy} danger>حذف</BulkBtn>
            <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />
            <button
              type="button"
              onClick={clearSelection}
              disabled={bulkBusy}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-ink disabled:opacity-50"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Single delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="حذف المنتج"
          message={`هل أنت متأكد من حذف «${deleteTarget.name_ar}»؟ لا يمكن التراجع.`}
          busy={deleting}
          onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Bulk delete confirmation */}
      {bulkDeleteOpen && (
        <ConfirmDialog
          title="حذف المنتجات"
          message={`هل أنت متأكد من حذف ${selected.size} منتج؟ لا يمكن التراجع.`}
          busy={bulkBusy}
          onCancel={() => (bulkBusy ? undefined : setBulkDeleteOpen(false))}
          onConfirm={runBulkDelete}
        />
      )}

      {/* Toast — lifts above the bulk bar when a selection is present */}
      {toast && (
        <div
          className={`fixed inset-x-0 z-50 flex justify-center px-4 ${
            selected.size > 0 ? 'bottom-24' : 'bottom-6'
          }`}
          aria-live="polite"
        >
          <div
            className="rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-white shadow-card"
            style={{
              backgroundColor:
                toast.kind === 'success' ? 'var(--color-ink)' : 'var(--color-error)',
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  )
}
