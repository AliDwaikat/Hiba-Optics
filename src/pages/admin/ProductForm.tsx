import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductImagePlaceholder from '../../components/ProductImagePlaceholder'
import { supabase } from '../../lib/supabase'
import {
  CATEGORY_LABELS_AR,
  type Audience,
  type Category,
  type FrameShape,
  type ProductColor,
  type ProductFeature,
} from '../../lib/products'
import {
  createProduct,
  fetchAdminBrands,
  fetchAdminProduct,
  updateProduct,
  type AdminBrand,
  type ProductWritePayload,
} from '../../lib/admin/products'
import { createBrand, DuplicateBrandNameError } from '../../lib/admin/brands'

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'sunglasses', label: CATEGORY_LABELS_AR.sunglasses },
  { value: 'optical', label: CATEGORY_LABELS_AR.optical },
  { value: 'contact_lenses', label: CATEGORY_LABELS_AR.contact_lenses },
  { value: 'accessories', label: CATEGORY_LABELS_AR.accessories },
]

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'unisex', label: 'للجنسين' },
  { value: 'men', label: 'رجالي' },
  { value: 'women', label: 'نسائي' },
  { value: 'kids', label: 'أطفال' },
]

// Empty value = null frame_shape (stored as null on save).
const FRAME_SHAPE_OPTIONS: { value: FrameShape | ''; label: string }[] = [
  { value: '', label: '(بدون تحديد)' },
  { value: 'round', label: 'مستدير' },
  { value: 'square', label: 'مربّع' },
  { value: 'rectangular', label: 'مستطيل' },
  { value: 'aviator', label: 'أفياتور' },
  { value: 'cat_eye', label: 'عين القطة' },
  { value: 'oval', label: 'بيضاوي' },
  { value: 'browline', label: 'براولاين' },
]

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ILS', label: '₪ شيكل' },
  { value: 'JOD', label: 'د.أ دينار' },
  { value: 'USD', label: '$ دولار' },
  { value: 'EUR', label: '€ يورو' },
]

/* ---- Local form state (numbers kept as strings for controlled inputs) ---- */
interface FormState {
  brand_id: string
  model: string
  name_ar: string
  name_en: string
  description_ar: string
  description_en: string
  category: Category
  audience: Audience
  frame_shape: FrameShape | ''
  price: string
  sale_price: string
  currency: string
  requires_consultation: boolean
  in_stock: boolean
  featured: boolean
  published: boolean
  position: string
  colors: ProductColor[]
  features: ProductFeature[]
  images: string[]
}

const EMPTY_FORM: FormState = {
  brand_id: '',
  model: '',
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  category: 'sunglasses',
  audience: 'unisex',
  frame_shape: '',
  price: '',
  sale_price: '',
  currency: 'ILS',
  requires_consultation: false,
  in_stock: true,
  featured: false,
  published: true,
  position: '0',
  colors: [],
  features: [],
  images: [],
}

type Errors = Partial<Record<'name_ar' | 'name_en' | 'price' | 'sale_price', string>>

/* ---- Small shared bits ---- */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card sm:p-6">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

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

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep ${
        checked ? 'bg-ink' : 'bg-gray-300'
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'rtl:-translate-x-4 ltr:translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-600">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

/* ---- Image thumbnail with graceful fallback ---- */
function ImageThumb({ src, className = 'h-11 w-11' }: { src: string; className?: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [src])
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-gray-900`}>
      {src && !broken ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ProductImagePlaceholder textClassName="text-[9px]" />
      )}
    </div>
  )
}

/** In-progress / failed uploads shown alongside the gallery. */
interface UploadItem {
  key: string
  name: string
  status: 'uploading' | 'error'
  message?: string
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // ~5MB

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_')
}

/* ---- Eyedropper: sample a color hex from an uploaded frame photo ---- */
function EyedropperIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 0 1 3 3L18 9l.4.4a2.1 2.1 0 0 1 0 3 2.1 2.1 0 0 1-3 0l-7.8-7.8a2.1 2.1 0 0 1 0-3 2.1 2.1 0 0 1 3 0Z" />
    </svg>
  )
}

function toHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

/**
 * Modal that renders one of the product's uploaded photos into a canvas and lets
 * the admin click a pixel to sample its color. Images load with
 * crossOrigin="anonymous" so the Supabase public bucket can be read without
 * tainting the canvas; if a read still fails (foreign/no-CORS URL) we show a
 * friendly Arabic message and the manual color picker remains the fallback.
 */
function ImageColorPicker({
  images,
  onPick,
  onClose,
}: {
  images: string[]
  onPick: (hex: string) => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [readError, setReadError] = useState(false)
  const [hover, setHover] = useState<{ x: number; y: number; hex: string } | null>(null)

  // (Re)draw the selected image whenever it changes.
  useEffect(() => {
    setLoading(true)
    setLoadError(false)
    setReadError(false)
    setHover(null)
    const canvas = canvasRef.current
    if (!canvas) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let cancelled = false
    img.onload = () => {
      if (cancelled) return
      const maxW = 440
      const maxH = 340
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const w = Math.max(1, Math.round(img.naturalWidth * scale))
      const h = Math.max(1, Math.round(img.naturalHeight * scale))
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      setLoading(false)
    }
    img.onerror = () => {
      if (cancelled) return
      setLoadError(true)
      setLoading(false)
    }
    img.src = images[idx]
    return () => {
      cancelled = true
    }
  }, [images, idx])

  /** Read the pixel under a client point; may throw on a tainted canvas. */
  function sampleAt(clientX: number, clientY: number): string {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('no-canvas')
    const rect = canvas.getBoundingClientRect()
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(clientX - rect.left)))
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(clientY - rect.top)))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no-ctx')
    const d = ctx.getImageData(x, y, 1, 1).data
    return toHex(d[0], d[1], d[2])
  }

  function handleMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (loading || loadError) return
    try {
      const hex = sampleAt(e.clientX, e.clientY)
      const rect = canvasRef.current!.getBoundingClientRect()
      setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, hex })
    } catch {
      // Tainted canvas — surface it on click, keep the loupe quiet.
      setHover(null)
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (loading || loadError) return
    try {
      const hex = sampleAt(e.clientX, e.clientY)
      onPick(hex)
      onClose()
    } catch {
      setReadError(true)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="اختر اللون من الصورة"
    >
      <div
        onClick={onClose}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
        className="fixed inset-0"
      />
      <div className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-ink">اختر اللون من الصورة</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink"
          >
            ×
          </button>
        </div>

        <p className="mt-1 text-xs text-gray-600">مرّر فوق الصورة وانقر على النقطة لأخذ لونها.</p>

        {/* Image selector when the product has more than one photo */}
        {images.length > 1 && (
          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`صورة ${i + 1}`}
                aria-current={i === idx}
                className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] border bg-white ring-2 transition ${
                  i === idx ? 'ring-yellow' : 'ring-transparent hover:ring-gray-300'
                } border-gray-300`}
              >
                <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex justify-center">
          <div className="relative inline-block">
            {loadError ? (
              <p className="px-6 py-10 text-sm" style={{ color: 'var(--color-error)' }}>
                تعذّر تحميل الصورة
              </p>
            ) : (
              <canvas
                ref={canvasRef}
                onMouseMove={handleMove}
                onMouseLeave={() => setHover(null)}
                onClick={handleClick}
                className="max-w-full cursor-crosshair rounded-[var(--radius-sm)] border border-gray-300"
              />
            )}
            {loading && !loadError && (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">
                جارٍ التحميل…
              </span>
            )}
            {/* Loupe: color under the cursor */}
            {hover && (
              <span
                className="pointer-events-none absolute z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow"
                style={{
                  backgroundColor: hover.hex,
                  left: hover.x + 14,
                  top: hover.y + 14,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Live preview of the color under the cursor */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <span
            className="inline-block h-6 w-6 rounded-[var(--radius-sm)] border border-gray-300"
            style={{ backgroundColor: hover?.hex ?? 'transparent' }}
            aria-hidden="true"
          />
          <span className="num" dir="ltr">
            {hover?.hex ?? '—'}
          </span>
        </div>

        {readError && (
          <p className="mt-3 text-sm" style={{ color: 'var(--color-error)' }}>
            تعذّر قراءة اللون من هذه الصورة. استخدم منتقي الألوان اليدوي.
          </p>
        )}
      </div>
    </div>
  )
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newImage, setNewImage] = useState('')
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const uploadCounter = useRef(0)
  // Which color row's "pick from image" popover is open (null = none).
  const [pickerFor, setPickerFor] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Inline "add new brand" dialog (create a brand without leaving the product form).
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [newBrand, setNewBrand] = useState({
    name_ar: '',
    name_en: '',
    position: '0',
    published: true,
  })
  const [brandErrors, setBrandErrors] = useState<{ name_ar?: string; name_en?: string }>({})
  const [brandSaving, setBrandSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const showToast = (text: string) => {
    window.clearTimeout(toastTimer.current)
    setToast(text)
    toastTimer.current = window.setTimeout(() => setToast(null), 2200)
  }
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  function openBrandDialog() {
    setNewBrand({ name_ar: '', name_en: '', position: '0', published: true })
    setBrandErrors({})
    setBrandDialogOpen(true)
  }

  async function saveNewBrand() {
    const name_ar = newBrand.name_ar.trim()
    const name_en = newBrand.name_en.trim()
    const nextErrors: { name_ar?: string; name_en?: string } = {}
    if (!name_ar) nextErrors.name_ar = 'اسم البراند بالعربية مطلوب'
    if (!name_en) nextErrors.name_en = 'اسم البراند بالإنجليزية مطلوب'
    if (nextErrors.name_ar || nextErrors.name_en) {
      setBrandErrors(nextErrors)
      return
    }
    setBrandErrors({})
    setBrandSaving(true)
    try {
      const posNum = Number.parseInt(newBrand.position, 10)
      const { id: newId } = await createBrand({
        name_ar,
        name_en,
        logo_url: null,
        position: Number.isFinite(posNum) ? posNum : 0,
        published: newBrand.published,
      })
      // Refresh the dropdown and auto-select the freshly created brand.
      const refreshed = await fetchAdminBrands()
      setBrands(refreshed)
      set('brand_id', newId)
      setBrandDialogOpen(false)
      showToast('تمت إضافة البراند')
    } catch (err) {
      if (err instanceof DuplicateBrandNameError) {
        setBrandErrors({ name_en: 'هذا البراند موجود مسبقاً' })
      } else {
        setBrandErrors({ name_en: 'تعذّر إضافة البراند، حاول مرة أخرى' })
      }
    } finally {
      setBrandSaving(false)
    }
  }

  // Load brands (always) + the product (edit mode).
  useEffect(() => {
    let active = true
    fetchAdminBrands()
      .then((b) => active && setBrands(b))
      .catch(() => active && setBrands([]))

    if (!isEdit) return
    setLoading(true)
    fetchAdminProduct(id as string)
      .then((p) => {
        if (!active) return
        if (!p) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setForm({
          brand_id: p.brand_id ?? '',
          model: p.model ?? '',
          name_ar: p.name_ar ?? '',
          name_en: p.name_en ?? '',
          description_ar: p.description_ar ?? '',
          description_en: p.description_en ?? '',
          category: p.category,
          audience: p.audience,
          frame_shape: p.frame_shape ?? '',
          price: String(p.price ?? ''),
          sale_price: p.sale_price != null ? String(p.sale_price) : '',
          currency: p.currency ?? 'ILS',
          requires_consultation: Boolean(p.requires_consultation),
          in_stock: Boolean(p.in_stock),
          featured: Boolean(p.featured),
          published: Boolean(p.published),
          position: String(p.position ?? 0),
          colors: Array.isArray(p.colors) ? p.colors : [],
          features: Array.isArray(p.features) ? p.features : [],
          images: Array.isArray(p.images) ? p.images : [],
        })
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setLoadError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, isEdit])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  /* Colors */
  const addColor = () =>
    set('colors', [...form.colors, { name_ar: '', name_en: '', hex: '#000000' }])
  const updateColor = (i: number, patch: Partial<ProductColor>) =>
    set('colors', form.colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  const removeColor = (i: number) => set('colors', form.colors.filter((_, idx) => idx !== i))

  /* Features */
  const addFeature = () => set('features', [...form.features, { text_ar: '', text_en: '' }])
  const updateFeature = (i: number, patch: Partial<ProductFeature>) =>
    set('features', form.features.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  const removeFeature = (i: number) =>
    set('features', form.features.filter((_, idx) => idx !== i))

  /* Images */
  function addImage() {
    const v = newImage.trim()
    if (!v) return
    set('images', [...form.images, v])
    setNewImage('')
  }
  function removeImage(i: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))
  }
  function moveImage(i: number, dir: -1 | 1) {
    setForm((f) => {
      const j = i + dir
      if (j < 0 || j >= f.images.length) return f
      const next = [...f.images]
      ;[next[i], next[j]] = [next[j], next[i]]
      return { ...f, images: next }
    })
  }

  const removeUpload = (key: string) => setUploads((u) => u.filter((x) => x.key !== key))

  /* Upload files to the public 'product-images' Storage bucket, then append the
     resulting public URLs to images[]. Each file is independent — one failure
     does not lose the others. */
  async function uploadOne(file: File) {
    if (!file.type.startsWith('image/')) {
      const key = `u${uploadCounter.current++}`
      setUploads((u) => [...u, { key, name: file.name, status: 'error', message: 'الملف ليس صورة' }])
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      const key = `u${uploadCounter.current++}`
      setUploads((u) => [
        ...u,
        { key, name: file.name, status: 'error', message: 'حجم الصورة يتجاوز 5 ميغابايت' },
      ])
      return
    }

    const key = `u${uploadCounter.current++}`
    setUploads((u) => [...u, { key, name: file.name, status: 'uploading' }])

    const path = `${Date.now()}-${sanitizeFilename(file.name)}`
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      const url = data.publicUrl
      setForm((f) => ({ ...f, images: [...f.images, url] }))
      setUploads((u) => u.filter((x) => x.key !== key))
    } catch {
      setUploads((u) =>
        u.map((x) => (x.key === key ? { ...x, status: 'error', message: 'تعذّر رفع الصورة' } : x)),
      )
    }
  }

  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (fileInputRef.current) fileInputRef.current.value = '' // allow re-selecting the same file
    await Promise.all(files.map((f) => uploadOne(f)))
  }

  /* Paste-to-upload: an image blob (screenshot / copied image) runs through the
     SAME validate + upload path as the file input; a pasted http(s) URL is
     appended like "add by link". Images append to the same images[] as the file
     picker, so the pasted image lands in the current product's list. */
  function handlePaste(e: React.ClipboardEvent) {
    const dt = e.clipboardData
    if (!dt) return

    // 1) Image blob → give it a sensible name and upload it.
    const imageItem = Array.from(dt.items || []).find(
      (it) => it.kind === 'file' && it.type.startsWith('image/'),
    )
    if (imageItem) {
      const blob = imageItem.getAsFile()
      if (blob) {
        e.preventDefault()
        const ext = (blob.type.split('/')[1] || 'png').replace('+xml', '')
        const named = new File([blob], `pasted-${Date.now()}.${ext}`, {
          type: blob.type || 'image/png',
        })
        void uploadOne(named)
        return
      }
    }

    // 2) Plain-text URL — but never hijack a paste into a real text field
    //    (e.g. the add-by-URL box or the name inputs).
    const target = e.target as HTMLElement | null
    const editable =
      !!target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    if (editable) return

    const text = dt.getData('text')?.trim()
    if (text && /^https?:\/\/\S+$/i.test(text)) {
      e.preventDefault()
      setForm((f) => ({ ...f, images: [...f.images, text] }))
    }
  }

  function validate(): Errors {
    const e: Errors = {}
    if (!form.name_ar.trim()) e.name_ar = 'الاسم بالعربية مطلوب'
    if (!form.name_en.trim()) e.name_en = 'الاسم بالإنجليزية مطلوب'

    const price = Number(form.price)
    if (form.price.trim() === '' || !Number.isFinite(price)) {
      e.price = 'السعر مطلوب'
    } else if (price < 0) {
      e.price = 'يجب أن يكون السعر صفراً أو أكثر'
    }

    if (form.sale_price.trim() !== '') {
      const sale = Number(form.sale_price)
      if (!Number.isFinite(sale) || sale < 0) {
        e.sale_price = 'سعر العرض غير صالح'
      } else if (Number.isFinite(price) && sale >= price) {
        e.sale_price = 'يجب أن يكون سعر العرض أقل من السعر الأساسي'
      }
    }
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (saving) return
    setSaveError(null)

    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    // Drop fully-empty repeatable rows before saving.
    const colors = form.colors.filter(
      (c) => c.name_ar.trim() || c.name_en.trim(),
    )
    const features = form.features.filter(
      (f) => f.text_ar.trim() || f.text_en.trim(),
    )

    const payload: ProductWritePayload = {
      brand_id: form.brand_id || null,
      model: form.model.trim() || null,
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim(),
      description_ar: form.description_ar.trim() || null,
      description_en: form.description_en.trim() || null,
      category: form.category,
      audience: form.audience,
      frame_shape: form.frame_shape || null,
      price: Number(form.price),
      sale_price: form.sale_price.trim() === '' ? null : Number(form.sale_price),
      currency: form.currency || 'ILS',
      images: form.images,
      colors,
      features,
      requires_consultation: form.requires_consultation,
      in_stock: form.in_stock,
      featured: form.featured,
      published: form.published,
      position: Number.isFinite(Number(form.position)) ? Number(form.position) : 0,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateProduct(id as string, payload)
      } else {
        await createProduct(payload)
      }
      navigate('/admin/products', { state: { flash: 'تم الحفظ' } })
    } catch {
      setSaveError('تعذّر حفظ المنتج، تحقق من الحقول وحاول مرة أخرى')
      setSaving(false)
    }
  }

  const title = isEdit ? 'تعديل المنتج' : 'إضافة منتج'

  // ---- Edit-mode load states ----
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-yellow"
          role="status"
          aria-label="جاري التحميل"
        />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
        <p className="text-lg text-ink">المنتج غير موجود</p>
        <Link to="/admin/products" className="btn btn-primary mt-6">
          العودة إلى المنتجات
        </Link>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
        <p className="text-lg text-ink">تعذّر تحميل المنتج</p>
        <p className="mt-2 text-sm text-gray-600">{loadError}</p>
        <Link to="/admin/products" className="btn btn-secondary mt-6">
          العودة إلى المنتجات
        </Link>
      </div>
    )
  }

  // Latin/number inputs render dir="ltr"; .field already aligns to `start`.
  const numField = 'field'

  return (
    <form onSubmit={handleSubmit} onPaste={handlePaste} noValidate className="pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Left column — main fields */}
        <div className="space-y-5 lg:col-span-2">
          <Section title="المعلومات الأساسية">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="البراند" htmlFor="brand_id">
                <div className="flex items-center gap-2">
                  <select
                    id="brand_id"
                    className="field"
                    value={form.brand_id}
                    onChange={(e) => set('brand_id', e.target.value)}
                  >
                    <option value="">بدون براند</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name_ar}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openBrandDialog}
                    title="إضافة براند جديد"
                    aria-label="إضافة براند جديد"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius)] border border-gray-300 text-lg font-bold text-ink transition-colors hover:border-yellow-deep hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-deep"
                  >
                    +
                  </button>
                </div>
              </Field>

              <Field label="الموديل (اختياري)" htmlFor="model">
                <input
                  id="model"
                  dir="ltr"
                  className={numField}
                  value={form.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="RB3025"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم بالعربية" htmlFor="name_ar" required error={errors.name_ar}>
                <input
                  id="name_ar"
                  className="field"
                  value={form.name_ar}
                  onChange={(e) => set('name_ar', e.target.value)}
                />
              </Field>

              <Field label="الاسم بالإنجليزية" htmlFor="name_en" required error={errors.name_en}>
                <input
                  id="name_en"
                  dir="ltr"
                  className={numField}
                  value={form.name_en}
                  onChange={(e) => set('name_en', e.target.value)}
                />
              </Field>
            </div>

            <Field label="الوصف بالعربية" htmlFor="description_ar">
              <textarea
                id="description_ar"
                className="field"
                rows={3}
                value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
              />
            </Field>

            <Field label="الوصف بالإنجليزية" htmlFor="description_en">
              <textarea
                id="description_en"
                dir="ltr"
                className={numField}
                rows={3}
                value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
              />
            </Field>
          </Section>

          <Section title="التصنيف">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الفئة" htmlFor="category">
                <select
                  id="category"
                  className="field"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value as Category)}
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="الفئة المستهدفة" htmlFor="audience">
                <select
                  id="audience"
                  className="field"
                  value={form.audience}
                  onChange={(e) => set('audience', e.target.value as Audience)}
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="شكل الإطار" htmlFor="frame_shape">
                <select
                  id="frame_shape"
                  className="field"
                  value={form.frame_shape}
                  onChange={(e) => set('frame_shape', e.target.value as FrameShape | '')}
                >
                  {FRAME_SHAPE_OPTIONS.map((o) => (
                    <option key={o.value || 'none'} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-600">
                  يُستخدم في ميزة «اعثر على إطارك» لمطابقة شكل الوجه — اختياري.
                </p>
              </Field>
            </div>
          </Section>

          <Section title="التسعير">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="السعر" htmlFor="price" required error={errors.price}>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  inputMode="decimal"
                  className={numField}
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                />
              </Field>

              <Field label="سعر العرض (اختياري)" htmlFor="sale_price" error={errors.sale_price}>
                <input
                  id="sale_price"
                  type="number"
                  min="0"
                  step="0.01"
                  dir="ltr"
                  inputMode="decimal"
                  className={numField}
                  value={form.sale_price}
                  onChange={(e) => set('sale_price', e.target.value)}
                />
              </Field>

              <Field label="العملة" htmlFor="currency">
                <select
                  id="currency"
                  className="field"
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  {CURRENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          {/* Colors */}
          <Section title="الألوان">
            {form.colors.length === 0 && (
              <p className="text-sm text-gray-600">لا توجد ألوان. أضف لوناً إذا رغبت.</p>
            )}
            <div className="space-y-3">
              {form.colors.map((c, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[8rem] flex-1">
                    <label className="mb-1 block text-xs text-gray-600">الاسم بالعربية</label>
                    <input
                      className="field"
                      value={c.name_ar}
                      onChange={(e) => updateColor(i, { name_ar: e.target.value })}
                    />
                  </div>
                  <div className="min-w-[8rem] flex-1">
                    <label className="mb-1 block text-xs text-gray-600">الاسم بالإنجليزية</label>
                    <input
                      dir="ltr"
                      className={numField}
                      value={c.name_en}
                      onChange={(e) => updateColor(i, { name_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">اللون</label>
                    <input
                      type="color"
                      aria-label="اختيار اللون"
                      className="h-[42px] w-14 cursor-pointer rounded-[var(--radius-sm)] border border-gray-300 bg-white p-1"
                      value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#000000'}
                      onChange={(e) => updateColor(i, { hex: e.target.value })}
                    />
                  </div>
                  {/* Eyedropper — only when there's an uploaded photo to sample from. */}
                  {form.images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPickerFor(i)}
                      className="btn btn-secondary inline-flex h-[42px] items-center gap-1.5 px-3 py-0"
                    >
                      <EyedropperIcon />
                      اختر من الصورة
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    className="btn btn-secondary h-[42px] px-3 py-0"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addColor} className="btn btn-secondary mt-1">
              + إضافة لون
            </button>

            {/* Pick-color-from-image popover for the active color row */}
            {pickerFor !== null && form.images.length > 0 && (
              <ImageColorPicker
                images={form.images}
                onPick={(hex) => updateColor(pickerFor, { hex })}
                onClose={() => setPickerFor(null)}
              />
            )}
          </Section>

          {/* Features */}
          <Section title="المميزات">
            {form.features.length === 0 && (
              <p className="text-sm text-gray-600">لا توجد مميزات. أضف ميزة إذا رغبت.</p>
            )}
            <div className="space-y-3">
              {form.features.map((f, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[8rem] flex-1">
                    <label className="mb-1 block text-xs text-gray-600">النص بالعربية</label>
                    <input
                      className="field"
                      value={f.text_ar}
                      onChange={(e) => updateFeature(i, { text_ar: e.target.value })}
                    />
                  </div>
                  <div className="min-w-[8rem] flex-1">
                    <label className="mb-1 block text-xs text-gray-600">النص بالإنجليزية</label>
                    <input
                      dir="ltr"
                      className={numField}
                      value={f.text_en}
                      onChange={(e) => updateFeature(i, { text_en: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="btn btn-secondary h-[42px] px-3 py-0"
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFeature} className="btn btn-secondary mt-1">
              + إضافة ميزة
            </button>
          </Section>

          {/* Images */}
          <Section title="الصور">
            <p className="text-xs text-gray-600">
              الصورة الأولى هي الصورة الرئيسية. يمكنك رفع صور أو إضافتها برابط. صور متعددة مسموحة.
            </p>

            {/* Current images — horizontal thumbnails */}
            {form.images.length > 0 && (
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
                {form.images.map((src, i) => (
                  <div key={`${src}-${i}`} className="w-24 shrink-0">
                    <div className="relative">
                      <ImageThumb src={src} className="h-24 w-24" />
                      {i === 0 && (
                        <span className="absolute inset-x-0 bottom-0 rounded-b-[var(--radius-sm)] bg-yellow px-1 py-0.5 text-center text-[10px] font-bold text-ink">
                          الصورة الرئيسية
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="إزالة الصورة"
                        className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {/* In RTL the primary sits on the right, so "toward primary" moves right. */}
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        aria-label="نقل نحو الرئيسية"
                        className="rounded px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === form.images.length - 1}
                        aria-label="نقل بعيداً عن الرئيسية"
                        className="rounded px-2 py-0.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      >
                        ‹
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload dropzone — focusable so the user can click it then paste */}
            <label
              tabIndex={0}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                handleFiles(e.dataTransfer.files)
              }}
              className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[var(--radius)] border-2 border-dashed border-gray-300 bg-gray-100 px-4 py-6 text-center transition-colors hover:border-yellow-deep focus-visible:outline-none focus-visible:border-yellow-deep focus-visible:ring-2 focus-visible:ring-yellow-deep"
            >
              <span className="text-sm font-medium text-ink">ارفع صورة</span>
              <span className="text-xs text-gray-600">
                اسحب وأفلت الصور هنا أو انقر للاختيار — JPG / PNG / WebP، حتى ٥ ميغابايت
              </span>
              <span className="text-xs text-gray-600">أو الصق صورة مباشرة (Ctrl+V)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>

            {/* Upload progress / errors */}
            {uploads.length > 0 && (
              <ul className="space-y-2">
                {uploads.map((u) => (
                  <li
                    key={u.key}
                    className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-gray-300 px-3 py-2 text-sm"
                  >
                    {u.status === 'uploading' ? (
                      <span
                        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-yellow"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="shrink-0" style={{ color: 'var(--color-error)' }}>
                        ⚠
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-gray-600" dir="ltr">
                      {u.name}
                    </span>
                    <span
                      className="shrink-0 text-xs"
                      style={{ color: u.status === 'error' ? 'var(--color-error)' : 'var(--color-gray-600)' }}
                    >
                      {u.status === 'uploading' ? 'جارٍ الرفع…' : u.message}
                    </span>
                    {u.status === 'error' && (
                      <button
                        type="button"
                        onClick={() => removeUpload(u.key)}
                        aria-label="إزالة"
                        className="shrink-0 text-gray-600 hover:text-ink"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Add by URL / path */}
            <div>
              <p className="mb-1.5 text-xs text-gray-600">أو أضِف صورة برابط أو مسار داخل public</p>
              <div className="flex gap-2">
                <input
                  dir="ltr"
                  className={numField}
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addImage()
                    }
                  }}
                  placeholder="https://… أو /products/example.jpg"
                />
                <button type="button" onClick={addImage} className="btn btn-secondary shrink-0">
                  إضافة برابط
                </button>
              </div>
            </div>
          </Section>
        </div>

        {/* Right column — flags */}
        <div className="space-y-5">
          <Section title="الحالة والخيارات">
            <ToggleRow
              label="بحاجة لفحص نظر"
              hint="فعّلها لإطارات النظارات الطبية"
              checked={form.requires_consultation}
              onChange={() => set('requires_consultation', !form.requires_consultation)}
            />
            <ToggleRow
              label="متوفر"
              checked={form.in_stock}
              onChange={() => set('in_stock', !form.in_stock)}
            />
            <ToggleRow
              label="مميز"
              checked={form.featured}
              onChange={() => set('featured', !form.featured)}
            />
            <ToggleRow
              label="منشور"
              checked={form.published}
              onChange={() => set('published', !form.published)}
            />

            <Field label="الترتيب" htmlFor="position">
              <input
                id="position"
                type="number"
                step="1"
                dir="ltr"
                inputMode="numeric"
                className={numField}
                value={form.position}
                onChange={(e) => set('position', e.target.value)}
              />
            </Field>
          </Section>
        </div>
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-300 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {saveError ? (
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              {saveError}
            </p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Link to="/admin/products" className="btn btn-secondary">
              إلغاء
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'جاري الحفظ…' : 'حفظ'}
            </button>
          </div>
        </div>
      </div>

      {/* Inline "add new brand" dialog */}
      {brandDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label="إضافة براند جديد"
        >
          <div
            onClick={brandSaving ? undefined : () => setBrandDialogOpen(false)}
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-black) 45%, transparent)' }}
            className="fixed inset-0"
          />
          <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card">
            <h3 className="text-lg font-bold text-ink">إضافة براند جديد</h3>
            <p className="mt-1 text-xs text-gray-600">
              يمكنك إضافة الشعار لاحقاً من صفحة البراندات.
            </p>

            <div className="mt-5 space-y-4">
              <Field
                label="اسم البراند بالعربية"
                htmlFor="new-br-name-ar"
                required
                error={brandErrors.name_ar}
              >
                <input
                  id="new-br-name-ar"
                  className="field"
                  value={newBrand.name_ar}
                  onChange={(e) => setNewBrand((b) => ({ ...b, name_ar: e.target.value }))}
                  autoFocus
                />
              </Field>

              <Field
                label="اسم البراند بالإنجليزية"
                htmlFor="new-br-name-en"
                required
                error={brandErrors.name_en}
              >
                <input
                  id="new-br-name-en"
                  dir="ltr"
                  className="field"
                  value={newBrand.name_en}
                  onChange={(e) => setNewBrand((b) => ({ ...b, name_en: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-2 items-end gap-4">
                <Field label="الترتيب" htmlFor="new-br-position">
                  <input
                    id="new-br-position"
                    type="number"
                    step="1"
                    dir="ltr"
                    inputMode="numeric"
                    className="field"
                    value={newBrand.position}
                    onChange={(e) => setNewBrand((b) => ({ ...b, position: e.target.value }))}
                  />
                </Field>
                <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newBrand.published}
                    onChange={(e) => setNewBrand((b) => ({ ...b, published: e.target.checked }))}
                  />
                  منشور
                </label>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBrandDialogOpen(false)}
                disabled={brandSaving}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveNewBrand}
                disabled={brandSaving}
                className="btn btn-primary"
              >
                {brandSaving ? 'جاري الحفظ…' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4" aria-live="polite">
          <div
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-card"
            style={{ backgroundColor: 'var(--color-ink)' }}
          >
            {toast}
          </div>
        </div>
      )}
    </form>
  )
}
