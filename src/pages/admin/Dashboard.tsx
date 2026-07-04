import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchAnalyticsRaw, type AnalyticsRaw } from '../../lib/admin/stats'
import { buildAnalytics, type RangeKey, type StatusSlice } from '../../lib/admin/analytics'
import type { OrderStatus } from '../../lib/admin/orders'

/* Brand palette (via CSS variables). */
const C = {
  yellow: 'var(--color-yellow)',
  yellowDeep: 'var(--color-yellow-deep)',
  ink: 'var(--color-ink)',
  gray600: 'var(--color-gray-600)',
  gray300: 'var(--color-gray-300)',
  success: 'var(--color-success)',
  error: 'var(--color-error)',
}
const STATUS_COLORS: Record<OrderStatus, string> = {
  new: C.yellow,
  confirmed: C.ink,
  delivered: C.success,
  cancelled: C.error,
}
const CATEGORY_COLORS = [C.yellow, C.ink, C.yellowDeep, C.gray600, C.gray300]

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: 'آخر 7 أيام' },
  { key: '30d', label: 'آخر 30 يوم' },
  { key: 'all', label: 'الكل' },
]

/* Western-digit formatters. */
const fmtInt = (v: number) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtMoney = (v: number) => `${fmtInt(v)} ₪`

const TOOLTIP = {
  contentStyle: {
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-gray-300)',
    boxShadow: 'var(--shadow-card)',
    fontSize: 12,
    direction: 'rtl' as const,
  },
  itemStyle: { color: 'var(--color-ink)' },
  labelStyle: { color: 'var(--color-gray-600)', marginBottom: 2 },
}
const AXIS_TICK = { fontSize: 11, fill: 'var(--color-gray-600)' }

/* ---- Layout bits ---- */
function ChartCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card ${className}`}
    >
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function EmptyChart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[var(--radius)] bg-gray-100 text-sm text-gray-600"
      style={{ height }}
    >
      لا توجد بيانات لهذه الفترة
    </div>
  )
}

function LegendRow({ items }: { items: { color: string; label: string; value?: string }[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: it.color }}
            aria-hidden="true"
          />
          <span className="text-ink">{it.label}</span>
          {it.value != null && <span className="num text-gray-600">{it.value}</span>}
        </span>
      ))}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card">
      <p className="text-xs text-gray-600">{label}</p>
      <p className="num mt-1.5 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  )
}

function CardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-[var(--radius-lg)] border border-gray-300 bg-white p-5 shadow-card"
      style={{ height }}
    >
      <div className="h-3.5 w-28 rounded bg-gray-100" />
      <div className="mt-5 h-[75%] rounded bg-gray-100" />
    </div>
  )
}

export default function Dashboard() {
  const [raw, setRaw] = useState<AnalyticsRaw | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<RangeKey>('30d')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetchAnalyticsRaw()
      .then((r) => {
        if (!active) return
        setRaw(r)
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

  // `new Date()` at runtime is fine (browser); memoised per range + data.
  const a = useMemo(() => (raw ? buildAnalytics(raw, range, new Date()) : null), [raw, range])

  const cards = [
    { label: 'المنتجات', value: raw ? raw.products.length : 0 },
    { label: 'الطلبات', value: raw ? raw.orders.length : 0 },
    { label: 'الحجوزات', value: raw ? raw.bookings.length : 0 },
  ]

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-ink">أهلاً بك في لوحة تحكم هبة أوبتكس</h2>
      <p className="mt-2 text-sm text-gray-600">نظرة عامة سريعة على المتجر.</p>

      {/* Existing top stat cards (all-time totals) */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-[var(--radius-lg)] border border-gray-300 bg-white p-6 shadow-card"
          >
            <p className="text-sm text-gray-600">{c.label}</p>
            {loading ? (
              <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-100" />
            ) : error ? (
              <p className="num mt-2 text-3xl font-extrabold text-ink">—</p>
            ) : (
              <p className="num mt-2 text-3xl font-extrabold text-ink">{fmtInt(c.value)}</p>
            )}
          </div>
        ))}
      </div>

      {/* ---- Analytics ---- */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-extrabold text-ink">التحليلات</h3>
        {/* Range segmented control */}
        <div className="inline-flex items-center rounded-full bg-gray-100 p-0.5">
          {RANGES.map((r) => {
            const active = range === r.key
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                aria-pressed={active}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
                  active ? 'bg-yellow font-semibold text-ink' : 'text-gray-600 hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-gray-300 bg-white p-12 text-center shadow-card">
          <p className="text-lg text-ink">تعذّر تحميل التحليلات</p>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      ) : loading || !a ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} height={104} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* KPI row */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="إجمالي الإيرادات" value={fmtMoney(a.kpis.revenue)} />
            <KpiCard label="عدد الطلبات" value={fmtInt(a.kpis.orders)} />
            <KpiCard label="متوسط قيمة الطلب" value={fmtMoney(a.kpis.avgOrder)} />
            <KpiCard label="عدد الحجوزات" value={fmtInt(a.kpis.bookings)} />
          </div>

          {/* Charts grid */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Revenue over time */}
            <ChartCard title="الإيرادات" className="lg:col-span-2">
              {a.hasOrders ? (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={a.revenue} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.yellow} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={C.yellow} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.gray300} vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={{ stroke: C.gray300 }}
                        minTickGap={16}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tickFormatter={(v) => fmtInt(v as number)}
                      />
                      <Tooltip {...TOOLTIP} formatter={(v) => [fmtMoney(v as number), 'الإيرادات']} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="الإيرادات"
                        stroke={C.yellow}
                        strokeWidth={2.5}
                        fill="url(#revFill)"
                        dot={false}
                        activeDot={{ r: 4, fill: C.yellowDeep }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Orders & bookings activity */}
            <ChartCard title="النشاط" className="lg:col-span-2">
              {a.hasActivity ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={a.activity} margin={{ top: 6, right: 8, left: 8, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.gray300} vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={AXIS_TICK}
                          tickLine={false}
                          axisLine={{ stroke: C.gray300 }}
                          minTickGap={16}
                        />
                        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                        <Tooltip {...TOOLTIP} />
                        <Bar dataKey="orders" name="الطلبات" fill={C.yellow} radius={[3, 3, 0, 0]} maxBarSize={26} />
                        <Bar dataKey="bookings" name="الحجوزات" fill={C.ink} radius={[3, 3, 0, 0]} maxBarSize={26} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <LegendRow
                    items={[
                      { color: C.yellow, label: 'الطلبات' },
                      { color: C.ink, label: 'الحجوزات' },
                    ]}
                  />
                </>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Sales by category */}
            <ChartCard title="المبيعات حسب الفئة">
              {a.hasCategories ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={a.categories}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {a.categories.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP} formatter={(v, n) => [fmtMoney(v as number), n as string]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <LegendRow
                    items={a.categories.map((s, i) => ({
                      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      label: s.name,
                      value: fmtMoney(s.value),
                    }))}
                  />
                </>
              ) : (
                <EmptyChart height={220} />
              )}
            </ChartCard>

            {/* Order status */}
            <ChartCard title="حالة الطلبات">
              {a.hasOrders && a.statuses.length > 0 ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={a.statuses}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {a.statuses.map((s: StatusSlice) => (
                            <Cell key={s.key} fill={STATUS_COLORS[s.key]} />
                          ))}
                        </Pie>
                        <Tooltip {...TOOLTIP} formatter={(v, n) => [fmtInt(v as number), n as string]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <LegendRow
                    items={a.statuses.map((s) => ({
                      color: STATUS_COLORS[s.key],
                      label: s.name,
                      value: fmtInt(s.value),
                    }))}
                  />
                </>
              ) : (
                <EmptyChart height={220} />
              )}
            </ChartCard>

            {/* Top products */}
            <ChartCard title="الأكثر مبيعاً" className="lg:col-span-2">
              {a.hasTop ? (
                <ol className="space-y-3">
                  {a.topProducts.map((p, i) => {
                    const max = a.topProducts[0].qty || 1
                    return (
                      <li key={`${p.name}-${i}`} className="flex items-center gap-3">
                        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-ink">
                          {fmtInt(i + 1)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm text-ink">{p.name}</span>
                            <span className="num shrink-0 text-sm font-semibold text-ink">
                              {fmtInt(p.qty)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-yellow"
                              style={{ width: `${Math.max(6, (p.qty / max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <EmptyChart height={160} />
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
