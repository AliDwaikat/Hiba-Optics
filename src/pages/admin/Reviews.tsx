import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  createReview,
  deleteReview,
  fetchAdminReviews,
  fetchReviewProducts,
  setReviewPublished,
  updateReview,
  type AdminReview,
  type ReviewProduct,
  type ReviewWritePayload,
} from '../../lib/admin/reviews'
import { Skeleton } from '../../components/Skeleton'

type PublishedFilter = 'all' | 'published' | 'unpublished'

const PUBLISHED_TABS: { value: PublishedFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'published', label: 'منشور' },
  { value: 'unpublished', label: 'غير منشور' },
]

function pillClass(active: boolean): string {
  return [
    'whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors',
    active ? 'bg-yellow font-semibold text-ink' : 'bg-gray-100 text-gray-600 hover:text-ink',
  ].join(' ')
}

/** Date + time with Western digits (dd/mm/yyyy · HH:MM, 24h). */
function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return `${date} · ${time}`
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />
    </svg>
  )
}

/** Read-only star rating with a Western-digit "n/5" label. */
function StarRating({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex items-center text-yellow" style={{ color: 'var(--color-yellow-deep)' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} filled={i < r} />
        ))}
      </span>
      <span className="num text-xs text-gray-600">{r}/5</span>
    </span>
  )
}

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={
        published
          ? { backgroundColor: '#dcfce7', color: '#15803d' }
          : { backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-600)' }
      }
    >
      {published ? 'منشور' : 'غير منشور'}
    </span>
  )
}

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

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-64 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Delete confirmation dialog ---- */
function ConfirmDialog({
  busy,
  onCancel,
  onConfirm,
}: {
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
        <h3 className="text-lg font-bold text-ink">حذف التقييم</h3>
        <p className="mt-2 text-sm text-gray-600">هل أنت متأكد من حذف هذا التقييم؟</p>
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

/* ---- Add / edit modal ---- */
interface ReviewFormValue {
  product_id: string
  author_name: string
  rating: number
  body: string
  published: boolean
}

type FormErrors = Partial<Record<'product_id' | 'author_name' | 'rating', string>>

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-gray-600"> *</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function ReviewModal({
  title,
  products,
  initial,
  saving,
  saveError,
  onCancel,
  onSubmit,
}: {
  title: string
  products: ReviewProduct[]
  initial: ReviewFormValue
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSubmit: (value: ReviewFormValue) => void
}) {
  const [value, setValue] = useState<ReviewFormValue>(initial)
  const [errors, setErrors] = useState<FormErrors>({})

  function set<K extends keyof ReviewFormValue>(k: K, v: ReviewFormValue[K]) {
    setValue((s) => ({ ...s, [k]: v }))
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e: FormErrors = {}
    if (!value.product_id) e.product_id = 'الرجاء اختيار المنتج'
    if (!value.author_name.trim()) e.author_name = 'اسم صاحب التقييم مطلوب'
    if (!(value.rating >= 1 && value.rating <= 5)) e.rating = 'التقييم من 1 إلى 5 مطلوب'
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onSubmit(value)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={saving ? undefined : onCancel}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
        className="absolute inset-0"
      />
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
      >
        <h3 className="text-lg font-bold text-ink">{title}</h3>

        <div className="mt-5 space-y-4">
          <Field label="المنتج" htmlFor="rv-product" required error={errors.product_id}>
            <select
              id="rv-product"
              className="field"
              value={value.product_id}
              onChange={(e) => set('product_id', e.target.value)}
            >
              <option value="">اختر المنتج</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ar}
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم صاحب التقييم" htmlFor="rv-author" required error={errors.author_name}>
            <input
              id="rv-author"
              className="field"
              value={value.author_name}
              onChange={(e) => set('author_name', e.target.value)}
            />
          </Field>

          <Field label="التقييم" required error={errors.rating}>
            <div className="flex items-center gap-2">
              <span className="flex items-center" style={{ color: 'var(--color-yellow-deep)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${i + 1} من 5`}
                    onClick={() => set('rating', i + 1)}
                    className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep"
                  >
                    <StarIcon filled={i < value.rating} />
                  </button>
                ))}
              </span>
              <span className="num text-sm text-gray-600">{value.rating}/5</span>
            </div>
          </Field>

          <Field label="نص التقييم" htmlFor="rv-body">
            <textarea
              id="rv-body"
              className="field"
              rows={4}
              value={value.body}
              onChange={(e) => set('body', e.target.value)}
            />
          </Field>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ink">منشور</span>
            <Switch
              checked={value.published}
              onChange={() => set('published', !value.published)}
              label="منشور"
            />
          </div>

          {saveError && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {saveError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-start gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary w-28">
            {saving ? 'جاري الحفظ…' : 'حفظ'}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className="btn btn-secondary">
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

/* ---- Page ---- */
type ModalState =
  | { mode: 'closed' }
  | { mode: 'add' }
  | { mode: 'edit'; review: AdminReview }

export default function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [products, setProducts] = useState<ReviewProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  function showToast(text: string, kind: 'success' | 'error') {
    window.clearTimeout(toastTimer.current)
    setToast({ text, kind })
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    Promise.all([fetchAdminReviews(), fetchReviewProducts().catch(() => [] as ReviewProduct[])])
      .then(([rvs, prods]) => {
        if (!active) return
        setReviews(rvs)
        setProducts(prods)
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

  const productNameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name_ar])),
    [products],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviews.filter((r) => {
      if (publishedFilter === 'published' && !r.published) return false
      if (publishedFilter === 'unpublished' && r.published) return false
      if (productFilter !== 'all' && r.product_id !== productFilter) return false
      if (q && !r.author_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [reviews, publishedFilter, productFilter, search])

  async function handleTogglePublished(review: AdminReview) {
    if (savingIds.has(review.id)) return
    const next = !review.published
    setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, published: next } : r)))
    setSavingIds((s) => new Set(s).add(review.id))
    try {
      await setReviewPublished(review.id, next)
      showToast('تم الحفظ', 'success')
    } catch {
      setReviews((rs) => rs.map((r) => (r.id === review.id ? { ...r, published: !next } : r)))
      showToast('تعذّر الحفظ، حاول مرة أخرى', 'error')
    } finally {
      setSavingIds((s) => {
        const n = new Set(s)
        n.delete(review.id)
        return n
      })
    }
  }

  async function handleModalSubmit(value: ReviewFormValue) {
    setModalError(null)
    setModalSaving(true)
    const payload: ReviewWritePayload = {
      product_id: value.product_id,
      author_name: value.author_name.trim(),
      rating: value.rating,
      body: value.body.trim() || null,
      published: value.published,
    }
    try {
      if (modal.mode === 'edit') {
        await updateReview(modal.review.id, payload)
        setReviews((rs) =>
          rs.map((r) => (r.id === modal.review.id ? { ...r, ...payload } : r)),
        )
      } else {
        const { id } = await createReview(payload)
        // Prepend (newest first); created_at approximated for immediate display.
        const created: AdminReview = { id, created_at: new Date().toISOString(), ...payload }
        setReviews((rs) => [created, ...rs])
      }
      setModal({ mode: 'closed' })
      showToast('تم الحفظ', 'success')
    } catch {
      setModalError('تعذّر حفظ التقييم، حاول مرة أخرى')
    } finally {
      setModalSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteReview(deleteTarget.id)
      setReviews((rs) => rs.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('تم الحذف', 'success')
    } catch {
      showToast('تعذّر حذف التقييم، حاول مرة أخرى', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const defaultProductId = products[0]?.id ?? ''
  const modalInitial: ReviewFormValue =
    modal.mode === 'edit'
      ? {
          product_id: modal.review.product_id,
          author_name: modal.review.author_name,
          rating: modal.review.rating,
          body: modal.review.body ?? '',
          published: modal.review.published,
        }
      : {
          product_id: defaultProductId,
          author_name: '',
          rating: 5,
          body: '',
          published: true,
        }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">التقييمات</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{reviews.length} تقييم</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError(null)
            setModal({ mode: 'add' })
          }}
          className="btn btn-primary"
        >
          + إضافة تقييم
        </button>
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {PUBLISHED_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPublishedFilter(tab.value)}
              className={pillClass(publishedFilter === tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم صاحب التقييم…"
            aria-label="بحث"
            className="field sm:max-w-xs"
          />
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            aria-label="تصفية حسب المنتج"
            className="field sm:w-56"
          >
            <option value="all">كل المنتجات</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">تعذّر تحميل التقييمات</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد تقييمات</p>
            <button
              type="button"
              onClick={() => {
                setModalError(null)
                setModal({ mode: 'add' })
              }}
              className="btn btn-primary mt-6"
            >
              + إضافة تقييم
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد تقييمات مطابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const productName = productNameById.get(r.product_id)
              return (
                <div
                  key={r.id}
                  className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-bold text-ink">{r.author_name}</span>
                        <StarRating rating={r.rating} />
                        <PublishedBadge published={r.published} />
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{productName ?? '—'}</p>
                    </div>
                    <span className="num shrink-0 text-xs text-gray-600" dir="ltr">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>

                  {r.body && <p className="mt-3 text-sm text-ink">{r.body}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.published}
                        disabled={savingIds.has(r.id)}
                        onChange={() => handleTogglePublished(r)}
                        label={`منشور: ${r.author_name}`}
                      />
                      <span className="text-sm text-gray-600">منشور</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalError(null)
                        setModal({ mode: 'edit', review: r })
                      }}
                      className="text-sm font-medium text-ink transition-colors hover:text-yellow-deep"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(r)}
                      className="text-sm font-medium transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-error)' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      {modal.mode !== 'closed' && (
        <ReviewModal
          key={modal.mode === 'edit' ? modal.review.id : 'add'}
          title={modal.mode === 'edit' ? 'تعديل التقييم' : 'إضافة تقييم'}
          products={products}
          initial={modalInitial}
          saving={modalSaving}
          saveError={modalError}
          onCancel={() => (modalSaving ? undefined : setModal({ mode: 'closed' }))}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          busy={deleting}
          onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
          <div
            className="rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-white shadow-card"
            style={{
              backgroundColor: toast.kind === 'success' ? 'var(--color-ink)' : 'var(--color-error)',
            }}
          >
            {toast.text}
          </div>
        </div>
      )}
    </div>
  )
}
