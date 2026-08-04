'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams as _useSP } from '@/shims/next-navigation'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type {
  KPIData, KPIMetric, RevenueTimePoint, StoreRevenue,
  CustomerSegment, BrandHealth, VoucherPerformance, FunnelStage,
  OrdersByHourPoint, TopProduct, HeatmapPoint,
} from '@/lib/dashboard/dummy-data'
import type { RealOverviewData, Period } from '@/lib/dashboard/real-metrics'
import ChatPanel from '@/components/ChatPanel'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import ThemeToggle from '@/components/ThemeToggle'
import FilterBar, { type FilterBarStore } from '@/components/analytics/FilterBar'
import DrillModal, { type DrillSpec } from '@/components/analytics/DrillModal'
import { useFilterPatch } from '@/lib/dashboard/use-filter-patch'
import { getDashColors } from '@/lib/dashboard/theme'
import { useTheme } from '@/lib/dashboard/use-theme'
const useSearchParams = _useSP

// ── Sparkline SVG ───────────────────────────────────────────────
function Sparkline({ data, color = '#B8922A' }: { data: number[]; color?: string }) {
  const safe = data.length > 0 ? data : [0]
  const min = Math.min(...safe)
  const max = Math.max(...safe)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = safe.map((v, i) => {
    const x = safe.length === 1 ? w / 2 : (i / (safe.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

// ── Animated count-up hook ──────────────────────────────────────
function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

// ── Format helpers ──────────────────────────────────────────────
function formatRupiah(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(1)}rb`
  return `Rp ${n}`
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString('id-ID')
}

// ── KPI Card ────────────────────────────────────────────────────
function KPICard({ label, metric, formatter }: {
  label: string
  metric: KPIMetric
  formatter: (n: number) => string
}) {
  const animated = useCountUp(metric.current)
  const isPositive = metric.changePercent >= 0

  return (
    <div className="group relative bg-dash-card border border-dash-border p-5 hover:border-hd-gold/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,146,42,0.08)]">
      <p className="eyebrow mb-3 text-dash-text-secondary">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="numeral text-[1.8rem] text-dash-text leading-none">{formatter(animated)}</p>
          <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {isPositive ? '↑' : '↓'} {Math.abs(metric.changePercent)}%
          </span>
        </div>
        <Sparkline data={metric.sparklineData} />
      </div>
    </div>
  )
}

// ── Collapsible section ─────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 mb-4 group w-full text-left"
      >
        <svg
          className={`w-4 h-4 text-dash-text-secondary transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h2 className="font-display text-[1.25rem] tracking-editorial text-dash-text">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-hd-gold/40 to-transparent" />
      </button>
      {open && <div className="animate-[fadeIn_0.2s_ease-out]">{children}</div>}
    </div>
  )
}

// ── Custom Recharts tooltip ─────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  const { theme } = useTheme()
  const colors = getDashColors(theme)
  if (!active || !payload?.length) return null
  return (
    <div className="border border-hd-gold/40 rounded-lg px-3 py-2 shadow-xl" style={{ backgroundColor: colors.card }}>
      <p className="text-[11px] text-hd-gold mb-1 font-semibold">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs" style={{ color: colors.textPrimary }}>
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span style={{ color: colors.textSecondary }}>{entry.name}:</span>
          <span className="font-semibold tabular-nums">{entry.value.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  )
}

// ── Revenue Heatmap ─────────────────────────────────────────────
function RevenueHeatmap({
  data,
  onCellClick,
}: {
  data: HeatmapPoint[]
  onCellClick?: (day: string, hour: number) => void
}) {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  const maxVal = Math.max(...data.map(d => d.value))

  const getColor = (value: number): { bg: string; text: string } => {
    const ratio = value / maxVal
    if (ratio < 0.25) return { bg: '#2A0F1C', text: 'rgba(255,255,255,0.55)' }
    if (ratio < 0.45) return { bg: '#3D2A10', text: 'rgba(255,255,255,0.65)' }
    if (ratio < 0.65) return { bg: '#8B6914', text: '#FEF2E3' }
    if (ratio < 0.8) return { bg: '#B8922A', text: '#1C0810' }
    return { bg: '#650A30', text: '#FEF2E3' }
  }

  const lookup = new Map<string, number>()
  data.forEach(p => lookup.set(`${p.day}-${p.hour}`, p.value))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Hour labels */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
          <div />
          {hours.map(h => (
            <div key={h} className="text-center text-[10px] text-dash-text-secondary font-mono">{h}:00</div>
          ))}
        </div>
        {/* Rows */}
        {days.map(day => (
          <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
            <div className="text-xs text-dash-text-secondary font-medium flex items-center">{day}</div>
            {hours.map(hour => {
              const val = lookup.get(`${day}-${hour}`) ?? 0
              const clickable = !!onCellClick && val > 0
              return (
                <button
                  key={hour}
                  type="button"
                  disabled={!clickable}
                  onClick={() => onCellClick?.(day, hour)}
                  title={clickable ? `Click to drill: ${day} ${hour}:00 — ${val} orders` : `${day} ${hour}:00 — ${val} orders`}
                  className={`aspect-[2/1] rounded-sm flex items-center justify-center text-[9px] font-mono transition-all duration-200 hover:scale-110 hover:z-10 ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{
                    backgroundColor: getColor(val).bg,
                    color: getColor(val).text,
                  }}
                >
                  {val}
                </button>
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-dash-text-secondary">Low</span>
          {['#2A0F1C', '#3D2A10', '#8B6914', '#B8922A', '#650A30'].map((c, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-dash-text-secondary">High</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function OverviewClient({
  period,
  data,
  stores: storeList,
}: {
  period: Period
  data: RealOverviewData
  stores: FilterBarStore[]
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [drill, setDrill] = useState<DrillSpec | null>(null)
  const { toggle: togglePatch } = useFilterPatch()
  const sp = useSearchParams()
  const activeStores = (sp.get('stores') ?? '').split(',').filter(Boolean)
  const activeTiers = (sp.get('tiers') ?? '').split(',').filter(Boolean)
  const activeChannels = (sp.get('channels') ?? '').split(',').filter(Boolean)
  const activeVoucherIds = (sp.get('vouchers') ?? '').split(',').filter(Boolean)
  const activeHasVoucher = sp.get('voucher')
  const { push: pushFilter } = useFilterPatch()
  const storeIdByName = new Map(storeList.map((s) => [s.name, s.id]))
  const [sortCol, setSortCol] = useState<string>('roi')
  const [sortAsc, setSortAsc] = useState(false)

  const kpi: KPIData = data.kpi
  const revenueSeries: RevenueTimePoint[] = data.revenueSeries
  const stores: StoreRevenue[] = data.stores
  const segments: CustomerSegment[] = data.segments
  const brandHealth: BrandHealth = data.brandHealth
  const vouchers: VoucherPerformance[] = data.vouchers
  const funnel: FunnelStage[] = data.funnel
  const ordersByHour: OrdersByHourPoint[] = data.ordersByHour
  const topProducts: TopProduct[] = data.topProducts.slice(0, 5)
  const heatmap: HeatmapPoint[] = data.heatmap

  // Sort vouchers
  const sortedVouchers = [...vouchers].sort((a, b) => {
    const key = sortCol as keyof VoucherPerformance
    const av = a[key] as number
    const bv = b[key] as number
    return sortAsc ? av - bv : bv - av
  })

  const handleVoucherSort = useCallback((col: string) => {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }, [sortCol, sortAsc])

  // Brand health for donut
  const totalOrders = brandHealth.fullPrice + brandHealth.withVoucher
  const fullPricePct = totalOrders > 0 ? ((brandHealth.fullPrice / totalOrders) * 100).toFixed(1) : '0'
  const voucherPct = totalOrders > 0 ? ((brandHealth.withVoucher / totalOrders) * 100).toFixed(1) : '0'
  const donutData = [
    { name: 'Full Price', value: brandHealth.fullPrice },
    { name: 'With Voucher', value: brandHealth.withVoucher },
  ]

  // Funnel max for bars
  const funnelMax = funnel[0]?.value ?? 1

  // Sorted stores
  const sortedStores = [...stores].sort((a, b) => b.revenue - a.revenue)

  // Tier colors
  const tierColors: Record<string, string> = {
    Silver: '#b8a89a',
    Gold: '#B8922A',
    Platinum: '#D4AC3A',
  }

  const { theme } = useTheme()
  const colors = getDashColors(theme)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-dash-card-border" style={{ backgroundColor: colors.headerBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="eyebrow text-hd-gold">HD Analytics</span>
              <h1 className="font-display text-[1.6rem] tracking-editorial text-dash-text leading-tight mt-0.5">
                Overview, <span className="italic">live.</span>
              </h1>
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-dash-text-secondary">Live · {period} window</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <AnalyticsTabs />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <FilterBar stores={storeList} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
          <KPICard label="Revenue" metric={kpi.revenue} formatter={formatRupiah} />
          <KPICard label="Orders" metric={kpi.orders} formatter={formatCompact} />
          <KPICard label="Active Members" metric={kpi.activeMembers} formatter={formatCompact} />
          <KPICard label="AOV" metric={kpi.aov} formatter={formatRupiah} />
          <KPICard label="Voucher Rate" metric={kpi.voucherRedemptionRate} formatter={(n) => `${n.toFixed(1)}%`} />
          <KPICard label="Referrals" metric={kpi.referralConversions} formatter={formatCompact} />
        </div>

        {/* ── Section 1: Revenue Performance ── */}
        <Section title="Revenue Performance">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Revenue line chart */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-dash-text mb-4">Revenue by Channel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueSeries}>
                  <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: colors.textSecondary, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => v === 0 ? '0' : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : `${(v / 1_000).toFixed(0)}rb`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="pickup" stroke={colors.burgundyLight} strokeWidth={2} dot={false} name="Pickup" />
                  <Line type="monotone" dataKey="delivery" stroke={colors.gold} strokeWidth={2} dot={false} name="Delivery" />
                  <Line type="monotone" dataKey="dinein" stroke={colors.textSecondary} strokeWidth={2} dot={false} name="Dine-in" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Store performance — click a row to filter by that store */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Store Performance</h3>
                <span className="text-[10px] text-dash-text-secondary">click to filter</span>
              </div>
              <div className="space-y-4">
                {sortedStores.map((s) => {
                  const maxRev = sortedStores[0].revenue
                  const pct = (s.revenue / maxRev) * 100
                  const storeId = storeIdByName.get(s.store)
                  const active = !!storeId && activeStores.includes(storeId)
                  const clickable = !!storeId
                  return (
                    <button
                      key={s.store}
                      disabled={!clickable}
                      onClick={() => storeId && togglePatch('stores', storeId)}
                      className={`w-full text-left block transition-opacity ${
                        clickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default opacity-60'
                      } ${active ? 'ring-1 ring-hd-gold/50 rounded-lg p-1 -m-1' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs ${active ? 'text-hd-gold' : 'text-dash-text-secondary'}`}>
                          {active ? '● ' : ''}{s.store}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-dash-text">{formatRupiah(s.revenue)}</span>
                          <span className={`text-[10px] font-semibold ${s.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {s.growth >= 0 ? '↑' : '↓'}{Math.abs(s.growth)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-dash-card-border rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-hd-burgundy to-[#8B1A45] transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 2: Customer Intelligence ── */}
        <Section title="Customer Intelligence">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Tier revenue — click a bar to filter */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Revenue by Tier</h3>
                <span className="text-[10px] text-dash-text-secondary">click bar to filter</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={segments}
                  layout="vertical"
                  onClick={(e) => {
                    const label = (e as { activeLabel?: string })?.activeLabel
                    if (!label) return
                    togglePatch('tiers', label.toLowerCase())
                  }}
                >
                  <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: colors.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => v === 0 ? '0' : v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : `${(v / 1_000).toFixed(0)}rb`} />
                  <YAxis type="category" dataKey="tier" tick={{ fill: colors.textSecondary, fontSize: 11 }} width={70} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} name="Revenue" cursor="pointer">
                    {segments.map((s) => {
                      const isActive = activeTiers.includes(s.tier.toLowerCase())
                      return (
                        <Cell
                          key={s.tier}
                          fill={tierColors[s.tier] ?? colors.gold}
                          fillOpacity={activeTiers.length === 0 || isActive ? 1 : 0.35}
                          stroke={isActive ? colors.gold : 'none'}
                          strokeWidth={isActive ? 2 : 0}
                        />
                      )
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Brand health donut — click to filter by voucher usage */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5 flex flex-col items-center justify-center">
              <div className="flex items-baseline justify-between w-full mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Brand Health</h3>
                <span className="text-[10px] text-dash-text-secondary">click segment</span>
              </div>
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={85}
                      dataKey="value"
                      startAngle={90} endAngle={-270}
                      stroke="none"
                      cursor="pointer"
                      onClick={(_, idx) => {
                        // idx 0 = Full Price (hasVoucher=false), idx 1 = With Voucher (true)
                        const target = idx === 0 ? false : true
                        const next = activeHasVoucher === String(target) ? null : target
                        pushFilter({ voucher: next })
                      }}
                    >
                      <Cell fill={colors.burgundyLight} fillOpacity={activeHasVoucher === null || activeHasVoucher === 'false' ? 1 : 0.35} />
                      <Cell fill={colors.gold} fillOpacity={activeHasVoucher === null || activeHasVoucher === 'true' ? 1 : 0.35} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-dash-text">{fullPricePct}%</span>
                  <span className="text-[10px] text-dash-text-secondary">Full Price</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {([
                  { label: 'Full Price', pct: fullPricePct, color: colors.burgundyLight, v: false },
                  { label: 'Voucher', pct: voucherPct, color: colors.gold, v: true },
                ] as const).map((o) => {
                  const active = activeHasVoucher === String(o.v)
                  return (
                    <button
                      key={o.label}
                      onClick={() => pushFilter({ voucher: active ? null : o.v })}
                      className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs transition-colors ${active ? 'bg-hd-burgundy text-dash-on-accent' : 'text-dash-text-secondary hover:text-dash-text'}`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: o.color }} />
                      {o.label} ({o.pct}%)
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 3: Marketing ROI ── */}
        <Section title="Marketing ROI">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Voucher table — click a row to filter */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5 overflow-x-auto">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Voucher Performance</h3>
                <span className="text-[10px] text-dash-text-secondary">click row to filter</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dash-card-border">
                    {[
                      { key: 'code', label: 'Code' },
                      { key: 'redeemed', label: 'Redeemed' },
                      { key: 'redemptionRate', label: 'Rate' },
                      { key: 'roi', label: 'ROI' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleVoucherSort(col.key)}
                        className="text-left py-2 px-2 text-dash-text-secondary font-medium cursor-pointer hover:text-dash-text transition-colors"
                      >
                        {col.label} {sortCol === col.key ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedVouchers.map(v => {
                    const active = !!v.id && activeVoucherIds.includes(v.id)
                    const clickable = !!v.id
                    return (
                      <tr
                        key={v.code}
                        onClick={() => clickable && togglePatch('vouchers', v.id!)}
                        className={`border-b border-dash-card-border/50 transition-colors ${clickable ? 'cursor-pointer hover:bg-dash-card-border/50' : ''} ${active ? 'bg-hd-burgundy/30 ring-1 ring-hd-gold/40' : ''}`}
                      >
                        <td className="py-2.5 px-2">
                          <span className={`font-mono font-medium ${active ? 'text-hd-gold' : 'text-dash-text'}`}>
                            {active ? '● ' : ''}{v.code}
                          </span>
                          <br />
                          <span className="text-[10px] text-dash-text-secondary">{v.title}</span>
                        </td>
                        <td className="py-2.5 px-2 text-dash-text-secondary">{v.redeemed.toLocaleString('id-ID')}/{v.issued.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-2 text-dash-text-secondary">{v.redemptionRate}%</td>
                        <td className="py-2.5 px-2">
                          <span className={`font-bold ${v.roi >= 2 ? 'text-hd-gold' : 'text-dash-text-secondary'}`}>
                            {v.roi.toFixed(1)}x
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Referral funnel (read-only — different population from orders) */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Referral Funnel</h3>
                <span className="text-[10px] text-dash-text-secondary/60" title="Referrals live in a separate table from orders, so there's no order-level filter to push.">read-only</span>
              </div>
              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const pct = (stage.value / funnelMax) * 100
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-dash-text-secondary">{stage.stage}</span>
                        <span className="text-xs font-semibold text-dash-text">{stage.value.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-3 bg-dash-card-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${colors.gold}, ${i === funnel.length - 1 ? colors.burgundyLight : colors.goldLight})`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 4: Operations ── */}
        <Section title="Operations">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Orders by hour — channel legend is clickable */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="text-sm font-semibold text-dash-text">Orders by Hour</h3>
                <div className="flex items-center gap-2">
                  {(['pickup', 'delivery', 'dinein'] as const).map((c) => {
                    const active = activeChannels.includes(c)
                    const dim = activeChannels.length > 0 && !active
                    const color = c === 'pickup' ? colors.burgundyLight : c === 'delivery' ? colors.gold : colors.textSecondary
                    return (
                      <button
                        key={c}
                        onClick={() => togglePatch('channels', c)}
                        className={`flex items-center gap-1 text-[10px] transition-opacity ${dim ? 'opacity-40' : ''} ${active ? 'font-semibold' : ''}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className={active ? 'text-dash-text' : 'text-dash-text-secondary'}>
                          {c === 'dinein' ? 'Dine-in' : c.charAt(0).toUpperCase() + c.slice(1)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ordersByHour}>
                  <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fill: colors.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => `${v}:00`} />
                  <YAxis tick={{ fill: colors.textSecondary, fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="pickup" stackId="a" fill={colors.burgundyLight} name="Pickup" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="delivery" stackId="a" fill={colors.gold} name="Delivery" />
                  <Bar dataKey="dinein" stackId="a" fill={colors.textSecondary} name="Dine-in" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Top 5 products */}
            <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-dash-text mb-4">Top 5 Products</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-dash-card-border">
                    <th className="text-left py-2 px-2 text-dash-text-secondary font-medium w-8">#</th>
                    <th className="text-left py-2 px-2 text-dash-text-secondary font-medium">Product</th>
                    <th className="text-right py-2 px-2 text-dash-text-secondary font-medium">Orders</th>
                    <th className="text-right py-2 px-2 text-dash-text-secondary font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const badges = ['🥇', '🥈', '🥉']
                    const badge = i < 3 ? badges[i] : `${i + 1}`
                    return (
                      <tr key={p.name} className="border-b border-dash-card-border/50 hover:bg-dash-card-border/30 transition-colors">
                        <td className="py-2.5 px-2 text-center">{badge}</td>
                        <td className="py-2.5 px-2 text-dash-text font-medium">{p.name}</td>
                        <td className="py-2.5 px-2 text-right text-dash-text-secondary tabular-nums">{p.orders.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-2 text-right text-dash-text font-medium tabular-nums">{formatRupiah(p.revenue)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ── Revenue Heatmap — click a cell to drill ── */}
        <Section title="Revenue Heatmap — Orders by Day & Hour">
          <div className="bg-dash-card border border-dash-card-border rounded-2xl p-5">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[11px] text-dash-text-secondary">Click a cell to inspect the underlying orders.</p>
            </div>
            <RevenueHeatmap
              data={heatmap}
              onCellClick={(day, hour) => {
                // day labels: 'Sen','Sel','Rab','Kam','Jum','Sab','Min' → iso 1..7
                const DAY_TO_ISO: Record<string, number> = { Sen: 1, Sel: 2, Rab: 3, Kam: 4, Jum: 5, Sab: 6, Min: 7 }
                setDrill({
                  title: `${day} · ${hour}:00`,
                  isoDow: DAY_TO_ISO[day],
                  hour,
                })
              }}
            />
          </div>
        </Section>
      </main>

      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#B8922A] to-[#D4AC3A] text-[#FEF2E3] shadow-xl shadow-[#B8922A]/30 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <span className="text-xl">&#10022;</span>
      </button>

      {/* ── Chat Panel ── */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── Drill-down Modal ── */}
      <DrillModal open={!!drill} onClose={() => setDrill(null)} spec={drill} />
    </div>
  )
}
