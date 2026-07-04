import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createBrand,
  deleteBrand,
  DuplicateBrandNameError,
  fetchAdminBrands,
  setBrandPublished,
  updateBrand,
  uploadBrandLogo,
  type AdminBrand,
  type BrandWritePayload,
} from '../../lib/admin/brands'

/* ---- Shared bits (match the other admin sections) ---- */
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

function Field({
  label,
  htmlFor,
  error,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-gray-600"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

/* Logo preview — renders the uploaded logo, else the styled name_en fallback the
   PUBLIC site uses (so the admin preview matches what visitors will see). */
function LogoPreview({
  logoUrl,
  nameEn,
  broken,
  onError,
  className = '',
}: {
  logoUrl: string | null
  nameEn: string
  broken?: boolean
  onError?: () => void
  className?: string
}) {
  if (logoUrl && !broken) {
    return (
      <img
        src={logoUrl}
        alt={nameEn}
        onError={onError}
        className={`max-h-full w-auto object-contain ${className}`}
      />
    )
  }
  if (nameEn.trim()) {
    return (
      <span className="latin text-xl font-medium tracking-[0.08em] text-ink sm:text-2xl">
        {nameEn}
      </span>
    )
  }
  return <span className="text-xs text-gray-600">لا يوجد شعار</span>
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-14 w-24 rounded bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-gray-100" />
                <div className="h-3 w-24 rounded bg-gray-100" />
              </div>
              <div className="h-5 w-9 rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---- Delete confirmation ---- */
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
        <h3 className="text-lg font-bold text-ink">حذف البراند</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          هل أنت متأكد من حذف هذا البراند؟ سيتم فك ارتباط منتجاته بالبراند (تبقى المنتجات موجودة بدون
          براند).
        </p>
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
interface BrandFormValue {
  name_ar: string
  name_en: string
  logo_url: string | null
  position: string
  published: boolean
}

const EMPTY_BRAND: BrandFormValue = {
  name_ar: '',
  name_en: '',
  logo_url: null,
  position: '0',
  published: true,
}

function toFormValue(b: AdminBrand): BrandFormValue {
  return {
    name_ar: b.name_ar ?? '',
    name_en: b.name_en ?? '',
    logo_url: b.logo_url ?? null,
    position: String(b.position ?? 0),
    published: Boolean(b.published),
  }
}

function toPayload(v: BrandFormValue): BrandWritePayload {
  return {
    name_ar: v.name_ar.trim(),
    name_en: v.name_en.trim(),
    logo_url: v.logo_url && v.logo_url.trim() !== '' ? v.logo_url.trim() : null,
    position: Number.isFinite(Number(v.position)) ? Number(v.position) : 0,
    published: v.published,
  }
}

function BrandModal({
  title,
  initial,
  saving,
  saveError,
  nameEnError,
  onCancel,
  onSubmit,
}: {
  title: string
  initial: BrandFormValue
  saving: boolean
  saveError: string | null
  nameEnError: string | null
  onCancel: () => void
  onSubmit: (v: BrandFormValue) => void
}) {
  const [value, setValue] = useState<BrandFormValue>(initial)
  const [nameArError, setNameArError] = useState<string | undefined>(undefined)
  const [nameEnLocalError, setNameEnLocalError] = useState<string | undefined>(undefined)

  // Logo upload/URL state.
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [logoBroken, setLogoBroken] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof BrandFormValue>(k: K, v: BrandFormValue[K]) {
    setValue((s) => ({ ...s, [k]: v }))
  }

  function setLogo(url: string | null) {
    setLogoBroken(false)
    set('logo_url', url)
  }

  async function uploadFile(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const url = await uploadBrandLogo(file)
      setLogo(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'تعذّر رفع الصورة')
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(list: FileList | null) {
    const file = Array.from(list ?? [])[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (file) void uploadFile(file)
  }

  // Ctrl+V an image anywhere in the modal → upload it as the logo. A pasted URL
  // into a text field pastes normally (not hijacked).
  function handlePaste(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData?.items ?? []).find(
      (it) => it.kind === 'file' && it.type.startsWith('image/'),
    )
    if (!item) return
    const blob = item.getAsFile()
    if (!blob) return
    e.preventDefault()
    const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '')
    void uploadFile(new File([blob], `pasted-${Date.now()}.${ext}`, { type: blob.type || 'image/png' }))
  }

  function addByUrl() {
    const v = urlInput.trim()
    if (!v) return
    setLogo(v)
    setUrlInput('')
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    let ok = true
    if (!value.name_ar.trim()) {
      setNameArError('اسم البراند بالعربية مطلوب')
      ok = false
    } else setNameArError(undefined)
    if (!value.name_en.trim()) {
      setNameEnLocalError('اسم البراند بالإنجليزية مطلوب')
      ok = false
    } else setNameEnLocalError(undefined)
    if (!ok) return
    onSubmit(value)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={saving ? undefined : onCancel}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
        className="fixed inset-0"
      />
      <form
        onSubmit={handleSubmit}
        onPaste={handlePaste}
        noValidate
        className="relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
      >
        <h3 className="text-lg font-bold text-ink">{title}</h3>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم البراند بالعربية" htmlFor="br-name-ar" required error={nameArError}>
              <input
                id="br-name-ar"
                className="field"
                value={value.name_ar}
                onChange={(e) => set('name_ar', e.target.value)}
              />
            </Field>
            <Field
              label="اسم البراند بالإنجليزية"
              htmlFor="br-name-en"
              required
              error={nameEnLocalError ?? nameEnError ?? undefined}
            >
              <input
                id="br-name-en"
                dir="ltr"
                className="field"
                value={value.name_en}
                onChange={(e) => set('name_en', e.target.value)}
              />
            </Field>
          </div>

          {/* Logo uploader */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">شعار البراند</span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-gray-300 bg-gray-100 p-2">
                <LogoPreview
                  logoUrl={value.logo_url}
                  nameEn={value.name_en}
                  broken={logoBroken}
                  onError={() => setLogoBroken(true)}
                />
              </div>
              {value.logo_url && (
                <button
                  type="button"
                  onClick={() => setLogo(null)}
                  className="text-sm font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-error)' }}
                >
                  إزالة الشعار
                </button>
              )}
            </div>

            {/* Dropzone (upload / drop / paste) */}
            <label
              tabIndex={0}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFiles(e.dataTransfer.files)
              }}
              className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius)] border-2 border-dashed border-gray-300 bg-gray-100 px-4 py-5 text-center transition-colors hover:border-yellow-deep focus-visible:border-yellow-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep"
            >
              <span className="text-sm font-medium text-ink">
                {value.logo_url ? 'استبدال الشعار' : 'ارفع الشعار'}
              </span>
              <span className="text-xs text-gray-600">
                اسحب وأفلت أو انقر للاختيار — JPG / PNG / WebP، حتى ٥ ميغابايت
              </span>
              <span className="text-xs text-gray-600">أو الصق صورة مباشرة (Ctrl+V)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {uploading && (
              <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <span
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-yellow"
                  aria-hidden="true"
                />
                جارٍ الرفع…
              </p>
            )}
            {uploadError && (
              <p className="mt-2 text-sm" style={{ color: 'var(--color-error)' }}>
                {uploadError}
              </p>
            )}

            {/* Add by URL */}
            <div className="mt-3">
              <p className="mb-1.5 text-xs text-gray-600">أو أضِف الشعار برابط</p>
              <div className="flex gap-2">
                <input
                  dir="ltr"
                  className="field"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addByUrl()
                    }
                  }}
                  placeholder="https://…/logo.png"
                />
                <button
                  type="button"
                  onClick={addByUrl}
                  className="btn btn-secondary shrink-0"
                >
                  إضافة
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              استخدم شعار البراند الرسمي المرخّص من الوكيل فقط.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الترتيب" htmlFor="br-pos">
              <input
                id="br-pos"
                type="number"
                step="1"
                dir="ltr"
                inputMode="numeric"
                className="field"
                value={value.position}
                onChange={(e) => set('position', e.target.value)}
              />
            </Field>
            <div className="flex items-end justify-between sm:pb-2">
              <span className="text-sm font-medium text-ink">منشور</span>
              <Switch
                checked={value.published}
                onChange={() => set('published', !value.published)}
                label="منشور"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {saveError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-start gap-3">
          <button type="submit" disabled={saving || uploading} className="btn btn-primary w-28">
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

/* ---- Row logo (list) — handles a broken image URL by falling back to text ---- */
function RowLogo({ brand }: { brand: AdminBrand }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-gray-100 bg-gray-100 p-1.5">
      <LogoPreview
        logoUrl={brand.logo_url}
        nameEn={brand.name_en}
        broken={broken}
        onError={() => setBroken(true)}
      />
    </div>
  )
}

/* ---- Page ---- */
type ModalState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; brand: AdminBrand }

export default function AdminBrands() {
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [nameEnError, setNameEnError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminBrand | null>(null)
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
    fetchAdminBrands()
      .then((data) => {
        if (!active) return
        setBrands(data)
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

  function openAdd() {
    setModalError(null)
    setNameEnError(null)
    setModal({ mode: 'add' })
  }
  function openEdit(brand: AdminBrand) {
    setModalError(null)
    setNameEnError(null)
    setModal({ mode: 'edit', brand })
  }

  async function handleTogglePublished(brand: AdminBrand) {
    if (savingIds.has(brand.id)) return
    const next = !brand.published
    setBrands((bs) => bs.map((b) => (b.id === brand.id ? { ...b, published: next } : b)))
    setSavingIds((s) => new Set(s).add(brand.id))
    try {
      await setBrandPublished(brand.id, next)
      showToast('تم الحفظ', 'success')
    } catch {
      setBrands((bs) => bs.map((b) => (b.id === brand.id ? { ...b, published: !next } : b)))
      showToast('تعذّر الحفظ، حاول مرة أخرى', 'error')
    } finally {
      setSavingIds((s) => {
        const n = new Set(s)
        n.delete(brand.id)
        return n
      })
    }
  }

  async function handleModalSubmit(v: BrandFormValue) {
    setModalError(null)
    setNameEnError(null)
    setModalSaving(true)
    const payload = toPayload(v)
    try {
      if (modal.mode === 'edit') {
        await updateBrand(modal.brand.id, payload)
        setBrands((bs) =>
          bs
            .map((b) => (b.id === modal.brand.id ? { ...b, ...payload } : b))
            .sort((a, b) => a.position - b.position),
        )
      } else {
        const { id } = await createBrand(payload)
        const created: AdminBrand = { id, created_at: new Date().toISOString(), ...payload }
        setBrands((bs) => [...bs, created].sort((a, b) => a.position - b.position))
      }
      setModal({ mode: 'closed' })
      showToast('تم الحفظ', 'success')
    } catch (err) {
      if (err instanceof DuplicateBrandNameError) {
        setNameEnError('اسم البراند بالإنجليزية مستخدم لبراند آخر، اختر اسماً مختلفاً.')
      } else {
        setModalError('تعذّر حفظ البراند، حاول مرة أخرى')
      }
    } finally {
      setModalSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBrand(deleteTarget.id)
      setBrands((bs) => bs.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('تم الحذف', 'success')
    } catch {
      showToast('تعذّر حذف البراند، حاول مرة أخرى', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const modalInitial: BrandFormValue =
    modal.mode === 'edit' ? toFormValue(modal.brand) : EMPTY_BRAND

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">البراندات</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{brands.length} براند</p>
          )}
        </div>
        <button type="button" onClick={openAdd} className="btn btn-primary">
          + إضافة براند
        </button>
      </div>

      {/* Body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">تعذّر تحميل البراندات</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد براندات</p>
            <button type="button" onClick={openAdd} className="btn btn-primary mt-6">
              + إضافة براند
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {brands.map((b) => (
              <div
                key={b.id}
                className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <RowLogo brand={b} />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-ink">{b.name_ar}</h3>
                      <p className="latin mt-0.5 text-sm text-gray-600" dir="ltr">
                        {b.name_en}
                      </p>
                      <p className="num mt-1 text-xs text-gray-600">الترتيب: {b.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={b.published}
                      disabled={savingIds.has(b.id)}
                      onChange={() => handleTogglePublished(b)}
                      label={`منشور: ${b.name_ar}`}
                    />
                    <span className="text-sm text-gray-600">منشور</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="text-sm font-medium text-ink transition-colors hover:text-yellow-deep"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(b)}
                    className="text-sm font-medium transition-opacity hover:opacity-70"
                    style={{ color: 'var(--color-error)' }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / edit modal */}
      {modal.mode !== 'closed' && (
        <BrandModal
          key={modal.mode === 'edit' ? modal.brand.id : 'add'}
          title={modal.mode === 'edit' ? 'تعديل البراند' : 'إضافة براند'}
          initial={modalInitial}
          saving={modalSaving}
          saveError={modalError}
          nameEnError={nameEnError}
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
