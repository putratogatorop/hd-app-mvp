'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  getKPIData, getRevenueTimeSeries, getRevenueByStore,
  getCustomerSegments, getBrandHealth, getVoucherPerformance,
  getReferralFunnel, getOrdersByHour, getTopProducts, getRevenueHeatmap,
} from '@/lib/dashboard/dummy-data'
import type {
  KPIData, KPIMetric, RevenueTimePoint, StoreRevenue,
  CustomerSegment, BrandHealth, VoucherPerformance, FunnelStage,
  OrdersByHourPoint, TopProduct, HeatmapPoint,
} from '@/lib/dashboard/dummy-data'
import ChatPanel from '@/components/ChatPanel'
import AnalyticsTabs from '@/components/AnalyticsTabs'

// ── Theme constants ─────────────────────────────────────────────
const COLORS = {
  bg: '#0F0F12',
  card: '#1A1A24',
  cardBorder: '#2A2A35',
  burgundy: '#650A30',
  burgundyLight: '#8B1A45',
  gold: '#B8922A',
  goldLight: '#D4AC3A',
  emerald: '#10B981',
  red: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  gridLine: '#2A2A35',
}

const PERIOD_MAP: Record<string, string> = { '7d': 'week', '30d': 'month', '90d': 'month' }

// ── Sparkline SVG ───────────────────────────────────────────────
function Sparkline({ data, color = COLORS.gold }: { data: number[]; color?: string }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
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
    <div className="group relative bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 hover:border-[#B8922A]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,146,42,0.08)]">
      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatter(animated)}</p>
          <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? '\u2191' : '\u2193'} {Math.abs(metric.changePercent)}%
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
          className={`w-4 h-4 text-[#9CA3AF] transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-[#B8922A]/40 to-transparent" />
      </button>
      {open && <div className="animate-[fadeIn_0.2s_ease-out]">{children}</div>}
    </div>
  )
}

// ── Custom Recharts tooltip ─────────────────────────────────────
function DarkTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1A1A24] border border-[#650A30] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString('id-ID')}
        </p>
      ))}
    </div>
  )
}

// ── Revenue Heatmap ─────────────────────────────────────────────
function RevenueHeatmap({ data }: { data: HeatmapPoint[] }) {
  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  const maxVal = Math.max(...data.map(d => d.value))

  const getColor = (value: number) => {
    const ratio = value / maxVal
    if (ratio < 0.25) return '#1A1A24'
    if (ratio < 0.45) return '#3D2A10'
    if (ratio < 0.65) return '#8B6914'
    if (ratio < 0.8) return '#B8922A'
    return '#650A30'
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
            <div key={h} className="text-center text-[10px] text-[#9CA3AF] font-mono">{h}:00</div>
          ))}
        </div>
        {/* Rows */}
        {days.map(day => (
          <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `60px repeat(${hours.length}, 1fr)` }}>
            <div className="text-xs text-[#9CA3AF] font-medium flex items-center">{day}</div>
            {hours.map(hour => {
              const val = lookup.get(`${day}-${hour}`) ?? 0
              return (
                <div
                  key={hour}
                  title={`${day} ${hour}:00 — ${val} orders`}
                  className="aspect-[2/1] rounded-sm flex items-center justify-center text-[9px] font-mono transition-all duration-200 hover:scale-110 hover:z-10 cursor-default"
                  style={{
                    backgroundColor: getColor(val),
                    color: val / maxVal > 0.45 ? '#FFF' : '#666',
                  }}
                >
                  {val}
                </div>
              )
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-[#9CA3AF]">Low</span>
          {['#1A1A24', '#3D2A10', '#8B6914', '#B8922A', '#650A30'].map((c, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-[#9CA3AF]">High</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const [period, setPeriod] = useState<string>('30d')
  const [chatOpen, setChatOpen] = useState(false)
  const [sortCol, setSortCol] = useState<string>('roi')
  const [sortAsc, setSortAsc] = useState(false)

  const kpi: KPIData = getKPIData(PERIOD_MAP[period] ?? 'month')
  const revenueSeries: RevenueTimePoint[] = getRevenueTimeSeries(PERIOD_MAP[period] ?? 'month')
  const stores: StoreRevenue[] = getRevenueByStore()
  const segments: CustomerSegment[] = getCustomerSegments()
  const brandHealth: BrandHealth = getBrandHealth()
  const vouchers: VoucherPerformance[] = getVoucherPerformance()
  const funnel: FunnelStage[] = getReferralFunnel()
  const ordersByHour: OrdersByHourPoint[] = getOrdersByHour()
  const topProducts: TopProduct[] = getTopProducts().slice(0, 5)
  const heatmap: HeatmapPoint[] = getRevenueHeatmap()

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
  const fullPricePct = ((brandHealth.fullPrice / totalOrders) * 100).toFixed(1)
  const voucherPct = ((brandHealth.withVoucher / totalOrders) * 100).toFixed(1)
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
    Silver: '#9CA3AF',
    Gold: '#B8922A',
    Platinum: '#D4AC3A',
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#2A2A35]" style={{ backgroundColor: 'rgba(15,15,18,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">
              HD Analytics <span className="text-[#B8922A]">&#10022;</span>
            </h1>
            <span className="text-[10px] text-[#9CA3AF] bg-[#1A1A24] border border-[#2A2A35] px-2 py-0.5 rounded-full">Overview · demo data</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-[#9CA3AF]">Updated 2 min ago</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  period === p
                    ? 'bg-[#650A30] text-white shadow-lg shadow-[#650A30]/20'
                    : 'bg-[#1A1A24] text-[#9CA3AF] hover:bg-[#2A2A35]'
                }`}
              >
                {p}
              </button>
            ))}
            <select className="ml-2 bg-[#1A1A24] border border-[#2A2A35] text-xs text-[#9CA3AF] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#B8922A]">
              <option>All Stores</option>
              <option>PIK Avenue</option>
              <option>Grand Indonesia</option>
              <option>Plaza Senayan</option>
              <option>Pakuwon Surabaya</option>
            </select>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnalyticsTabs />
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
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue by Channel</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueSeries}>
                  <CartesianGrid stroke={COLORS.gridLine} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line type="monotone" dataKey="pickup" stroke={COLORS.burgundyLight} strokeWidth={2} dot={false} name="Pickup" />
                  <Line type="monotone" dataKey="delivery" stroke={COLORS.gold} strokeWidth={2} dot={false} name="Delivery" />
                  <Line type="monotone" dataKey="dinein" stroke={COLORS.textSecondary} strokeWidth={2} dot={false} name="Dine-in" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Store performance */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Store Performance</h3>
              <div className="space-y-4">
                {sortedStores.map((s) => {
                  const maxRev = sortedStores[0].revenue
                  const pct = (s.revenue / maxRev) * 100
                  return (
                    <div key={s.store}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#9CA3AF]">{s.store}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{formatRupiah(s.revenue)}</span>
                          <span className={`text-[10px] font-semibold ${s.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {s.growth >= 0 ? '\u2191' : '\u2193'}{Math.abs(s.growth)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-[#2A2A35] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#650A30] to-[#8B1A45] transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 2: Customer Intelligence ── */}
        <Section title="Customer Intelligence">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Tier revenue */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Revenue by Tier</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={segments} layout="vertical">
                  <CartesianGrid stroke={COLORS.gridLine} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}jt`} />
                  <YAxis type="category" dataKey="tier" tick={{ fill: COLORS.textSecondary, fontSize: 11 }} width={70} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} name="Revenue">
                    {segments.map((s) => (
                      <Cell key={s.tier} fill={tierColors[s.tier] ?? COLORS.gold} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Brand health donut */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-white mb-4 self-start">Brand Health</h3>
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
                    >
                      <Cell fill={COLORS.burgundyLight} />
                      <Cell fill={COLORS.gold} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{fullPricePct}%</span>
                  <span className="text-[10px] text-[#9CA3AF]">Full Price</span>
                </div>
              </div>
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.burgundyLight }} />
                  <span className="text-xs text-[#9CA3AF]">Full Price ({fullPricePct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                  <span className="text-xs text-[#9CA3AF]">Voucher ({voucherPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Section 3: Marketing ROI ── */}
        <Section title="Marketing ROI">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Voucher table */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5 overflow-x-auto">
              <h3 className="text-sm font-semibold text-white mb-4">Voucher Performance</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A35]">
                    {[
                      { key: 'code', label: 'Code' },
                      { key: 'redeemed', label: 'Redeemed' },
                      { key: 'redemptionRate', label: 'Rate' },
                      { key: 'roi', label: 'ROI' },
                    ].map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleVoucherSort(col.key)}
                        className="text-left py-2 px-2 text-[#9CA3AF] font-medium cursor-pointer hover:text-white transition-colors"
                      >
                        {col.label} {sortCol === col.key ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedVouchers.map(v => (
                    <tr key={v.code} className="border-b border-[#2A2A35]/50 hover:bg-[#2A2A35]/30 transition-colors">
                      <td className="py-2.5 px-2">
                        <span className="text-white font-mono font-medium">{v.code}</span>
                        <br />
                        <span className="text-[10px] text-[#9CA3AF]">{v.title}</span>
                      </td>
                      <td className="py-2.5 px-2 text-[#9CA3AF]">{v.redeemed.toLocaleString('id-ID')}/{v.issued.toLocaleString('id-ID')}</td>
                      <td className="py-2.5 px-2 text-[#9CA3AF]">{v.redemptionRate}%</td>
                      <td className="py-2.5 px-2">
                        <span className={`font-bold ${v.roi >= 2 ? 'text-[#B8922A]' : 'text-[#9CA3AF]'}`}>
                          {v.roi.toFixed(1)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Referral funnel */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Referral Funnel</h3>
              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const pct = (stage.value / funnelMax) * 100
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#9CA3AF]">{stage.stage}</span>
                        <span className="text-xs font-semibold text-white">{stage.value.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="h-3 bg-[#2A2A35] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${COLORS.gold}, ${i === funnel.length - 1 ? COLORS.burgundyLight : COLORS.goldLight})`,
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
            {/* Orders by hour */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Orders by Hour</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={ordersByHour}>
                  <CartesianGrid stroke={COLORS.gridLine} strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fill: COLORS.textSecondary, fontSize: 10 }} tickFormatter={(v: number) => `${v}:00`} />
                  <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="pickup" stackId="a" fill={COLORS.burgundyLight} name="Pickup" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="delivery" stackId="a" fill={COLORS.gold} name="Delivery" />
                  <Bar dataKey="dinein" stackId="a" fill={COLORS.textSecondary} name="Dine-in" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Top 5 products */}
            <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Top 5 Products</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2A2A35]">
                    <th className="text-left py-2 px-2 text-[#9CA3AF] font-medium w-8">#</th>
                    <th className="text-left py-2 px-2 text-[#9CA3AF] font-medium">Product</th>
                    <th className="text-right py-2 px-2 text-[#9CA3AF] font-medium">Orders</th>
                    <th className="text-right py-2 px-2 text-[#9CA3AF] font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => {
                    const badges = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49']
                    const badge = i < 3 ? badges[i] : `${i + 1}`
                    return (
                      <tr key={p.name} className="border-b border-[#2A2A35]/50 hover:bg-[#2A2A35]/30 transition-colors">
                        <td className="py-2.5 px-2 text-center">{badge}</td>
                        <td className="py-2.5 px-2 text-white font-medium">{p.name}</td>
                        <td className="py-2.5 px-2 text-right text-[#9CA3AF] tabular-nums">{p.orders.toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-2 text-right text-white font-medium tabular-nums">{formatRupiah(p.revenue)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ── Revenue Heatmap ── */}
        <Section title="Revenue Heatmap — Orders by Day & Hour">
          <div className="bg-[#1A1A24] border border-[#2A2A35] rounded-2xl p-5">
            <RevenueHeatmap data={heatmap} />
          </div>
        </Section>
      </main>

      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#B8922A] to-[#D4AC3A] text-white shadow-xl shadow-[#B8922A]/30 hover:scale-110 active:scale-95 transition-transform flex items-center justify-center"
        aria-label="Open AI Chat"
      >
        <span className="text-xl">&#10022;</span>
      </button>

      {/* ── Chat Panel ── */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
