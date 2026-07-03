import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createBranch,
  deleteBranch,
  fetchAdminBranches,
  setBranchPublished,
  updateBranch,
  type AdminBranch,
  type BranchWritePayload,
} from '../../lib/admin/branches'

/* ---- Shared bits ---- */
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

function SkeletonList() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-gray-100" />
              <div className="h-5 w-9 rounded-full bg-gray-100" />
            </div>
            <div className="h-3 w-64 rounded bg-gray-100" />
            <div className="h-3 w-1/3 rounded bg-gray-100" />
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
        <h3 className="text-lg font-bold text-ink">حذف الفرع</h3>
        <p className="mt-2 text-sm text-gray-600">هل أنت متأكد من حذف هذا الفرع؟</p>
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
interface BranchFormValue {
  name_ar: string
  name_en: string
  address_ar: string
  address_en: string
  landmark_ar: string
  landmark_en: string
  phone: string
  whatsapp: string
  hours_ar: string
  hours_en: string
  lat: string
  lng: string
  map_url: string
  position: string
  published: boolean
}

const EMPTY_BRANCH: BranchFormValue = {
  name_ar: '',
  name_en: '',
  address_ar: '',
  address_en: '',
  landmark_ar: '',
  landmark_en: '',
  phone: '',
  whatsapp: '',
  hours_ar: '',
  hours_en: '',
  lat: '',
  lng: '',
  map_url: '',
  position: '0',
  published: true,
}

function toFormValue(b: AdminBranch): BranchFormValue {
  return {
    name_ar: b.name_ar ?? '',
    name_en: b.name_en ?? '',
    address_ar: b.address_ar ?? '',
    address_en: b.address_en ?? '',
    landmark_ar: b.landmark_ar ?? '',
    landmark_en: b.landmark_en ?? '',
    phone: b.phone ?? '',
    whatsapp: b.whatsapp ?? '',
    hours_ar: b.hours_ar ?? '',
    hours_en: b.hours_en ?? '',
    lat: b.lat != null ? String(b.lat) : '',
    lng: b.lng != null ? String(b.lng) : '',
    map_url: b.map_url ?? '',
    position: String(b.position ?? 0),
    published: Boolean(b.published),
  }
}

function toPayload(v: BranchFormValue): BranchWritePayload {
  const num = (s: string) => (s.trim() === '' || !Number.isFinite(Number(s)) ? null : Number(s))
  const str = (s: string) => (s.trim() === '' ? null : s.trim())
  return {
    name_ar: v.name_ar.trim(),
    name_en: str(v.name_en),
    address_ar: str(v.address_ar),
    address_en: str(v.address_en),
    landmark_ar: str(v.landmark_ar),
    landmark_en: str(v.landmark_en),
    phone: str(v.phone),
    whatsapp: str(v.whatsapp),
    lat: num(v.lat),
    lng: num(v.lng),
    hours_ar: str(v.hours_ar),
    hours_en: str(v.hours_en),
    map_url: str(v.map_url),
    position: Number.isFinite(Number(v.position)) ? Number(v.position) : 0,
    published: v.published,
  }
}

function BranchModal({
  title,
  initial,
  saving,
  saveError,
  onCancel,
  onSubmit,
}: {
  title: string
  initial: BranchFormValue
  saving: boolean
  saveError: string | null
  onCancel: () => void
  onSubmit: (v: BranchFormValue) => void
}) {
  const [value, setValue] = useState<BranchFormValue>(initial)
  const [nameError, setNameError] = useState<string | undefined>(undefined)

  function set<K extends keyof BranchFormValue>(k: K, v: BranchFormValue[K]) {
    setValue((s) => ({ ...s, [k]: v }))
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!value.name_ar.trim()) {
      setNameError('اسم الفرع بالعربية مطلوب')
      return
    }
    setNameError(undefined)
    onSubmit(value)
  }

  const ltrField = 'field'

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
        noValidate
        className="relative w-full max-w-2xl rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
      >
        <h3 className="text-lg font-bold text-ink">{title}</h3>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الفرع بالعربية" htmlFor="b-name-ar" required error={nameError}>
              <input
                id="b-name-ar"
                className="field"
                value={value.name_ar}
                onChange={(e) => set('name_ar', e.target.value)}
              />
            </Field>
            <Field label="اسم الفرع بالإنجليزية" htmlFor="b-name-en">
              <input
                id="b-name-en"
                dir="ltr"
                className={ltrField}
                value={value.name_en}
                onChange={(e) => set('name_en', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان بالعربية" htmlFor="b-addr-ar">
              <input
                id="b-addr-ar"
                className="field"
                value={value.address_ar}
                onChange={(e) => set('address_ar', e.target.value)}
              />
            </Field>
            <Field label="العنوان بالإنجليزية" htmlFor="b-addr-en">
              <input
                id="b-addr-en"
                dir="ltr"
                className={ltrField}
                value={value.address_en}
                onChange={(e) => set('address_en', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="أقرب معلم بالعربية" htmlFor="b-lm-ar">
              <input
                id="b-lm-ar"
                className="field"
                value={value.landmark_ar}
                onChange={(e) => set('landmark_ar', e.target.value)}
              />
            </Field>
            <Field label="أقرب معلم بالإنجليزية" htmlFor="b-lm-en">
              <input
                id="b-lm-en"
                dir="ltr"
                className={ltrField}
                value={value.landmark_en}
                onChange={(e) => set('landmark_en', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الهاتف" htmlFor="b-phone">
              <input
                id="b-phone"
                dir="ltr"
                inputMode="tel"
                className={ltrField}
                value={value.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Field>
            <Field
              label="واتساب"
              htmlFor="b-wa"
              hint="بصيغة 9705XXXXXXXX لزر واتساب"
            >
              <input
                id="b-wa"
                dir="ltr"
                inputMode="tel"
                className={ltrField}
                value={value.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
                placeholder="9705XXXXXXXX"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ساعات العمل بالعربية" htmlFor="b-hours-ar">
              <input
                id="b-hours-ar"
                className="field"
                value={value.hours_ar}
                onChange={(e) => set('hours_ar', e.target.value)}
                placeholder="السبت - الخميس: 9 صباحاً - 8 مساءً"
              />
            </Field>
            <Field label="ساعات العمل بالإنجليزية" htmlFor="b-hours-en">
              <input
                id="b-hours-en"
                dir="ltr"
                className={ltrField}
                value={value.hours_en}
                onChange={(e) => set('hours_en', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="خط العرض (lat)" htmlFor="b-lat">
              <input
                id="b-lat"
                type="number"
                step="any"
                dir="ltr"
                inputMode="decimal"
                className={ltrField}
                value={value.lat}
                onChange={(e) => set('lat', e.target.value)}
              />
            </Field>
            <Field label="خط الطول (lng)" htmlFor="b-lng">
              <input
                id="b-lng"
                type="number"
                step="any"
                dir="ltr"
                inputMode="decimal"
                className={ltrField}
                value={value.lng}
                onChange={(e) => set('lng', e.target.value)}
              />
            </Field>
            <Field label="الترتيب" htmlFor="b-pos">
              <input
                id="b-pos"
                type="number"
                step="1"
                dir="ltr"
                inputMode="numeric"
                className={ltrField}
                value={value.position}
                onChange={(e) => set('position', e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="رابط الخريطة"
            htmlFor="b-map"
            hint="الصق رابط ‏'تضمين خريطة'‏ من خرائط Google (Embed src)"
          >
            <input
              id="b-map"
              dir="ltr"
              className={ltrField}
              value={value.map_url}
              onChange={(e) => set('map_url', e.target.value)}
              placeholder="https://www.google.com/maps/embed?..."
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
type ModalState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; branch: AdminBranch }

export default function AdminBranches() {
  const [branches, setBranches] = useState<AdminBranch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminBranch | null>(null)
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
    fetchAdminBranches()
      .then((data) => {
        if (!active) return
        setBranches(data)
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

  async function handleTogglePublished(branch: AdminBranch) {
    if (savingIds.has(branch.id)) return
    const next = !branch.published
    setBranches((bs) => bs.map((b) => (b.id === branch.id ? { ...b, published: next } : b)))
    setSavingIds((s) => new Set(s).add(branch.id))
    try {
      await setBranchPublished(branch.id, next)
      showToast('تم الحفظ', 'success')
    } catch {
      setBranches((bs) => bs.map((b) => (b.id === branch.id ? { ...b, published: !next } : b)))
      showToast('تعذّر الحفظ، حاول مرة أخرى', 'error')
    } finally {
      setSavingIds((s) => {
        const n = new Set(s)
        n.delete(branch.id)
        return n
      })
    }
  }

  async function handleModalSubmit(v: BranchFormValue) {
    setModalError(null)
    setModalSaving(true)
    const payload = toPayload(v)
    try {
      if (modal.mode === 'edit') {
        await updateBranch(modal.branch.id, payload)
        setBranches((bs) =>
          bs.map((b) => (b.id === modal.branch.id ? { ...b, ...payload } : b)),
        )
      } else {
        const { id } = await createBranch(payload)
        const created: AdminBranch = { id, created_at: new Date().toISOString(), ...payload }
        setBranches((bs) =>
          [...bs, created].sort((a, b) => a.position - b.position),
        )
      }
      setModal({ mode: 'closed' })
      showToast('تم الحفظ', 'success')
    } catch {
      setModalError('تعذّر حفظ الفرع، حاول مرة أخرى')
    } finally {
      setModalSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBranch(deleteTarget.id)
      setBranches((bs) => bs.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('تم الحذف', 'success')
    } catch {
      showToast('تعذّر حذف الفرع، حاول مرة أخرى', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const modalInitial: BranchFormValue =
    modal.mode === 'edit' ? toFormValue(modal.branch) : EMPTY_BRANCH

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">الفروع</h2>
          {!loading && !error && (
            <p className="num mt-1 text-sm text-gray-600">{branches.length} فرع</p>
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
          + إضافة فرع
        </button>
      </div>

      {/* Body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">تعذّر تحميل الفروع</p>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
            <p className="text-lg text-ink">لا توجد فروع</p>
            <button
              type="button"
              onClick={() => {
                setModalError(null)
                setModal({ mode: 'add' })
              }}
              className="btn btn-primary mt-6"
            >
              + إضافة فرع
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((b) => (
              <div
                key={b.id}
                className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-ink">{b.name_ar}</h3>
                    {(b.address_ar || b.landmark_ar) && (
                      <p className="mt-1 text-sm text-gray-600">
                        {[b.address_ar, b.landmark_ar].filter(Boolean).join(' — ')}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      {b.phone && (
                        <span className="num" dir="ltr">
                          ☎ {b.phone}
                        </span>
                      )}
                      {b.whatsapp && (
                        <span className="num" dir="ltr">
                          واتساب: {b.whatsapp}
                        </span>
                      )}
                    </div>
                    {b.hours_ar && <p className="mt-1 text-sm text-gray-600">{b.hours_ar}</p>}
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
                    onClick={() => {
                      setModalError(null)
                      setModal({ mode: 'edit', branch: b })
                    }}
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
        <BranchModal
          key={modal.mode === 'edit' ? modal.branch.id : 'add'}
          title={modal.mode === 'edit' ? 'تعديل الفرع' : 'إضافة فرع'}
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
