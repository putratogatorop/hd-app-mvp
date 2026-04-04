'use client'

import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  getKPIData,
  getRevenueTimeSeries,
  getRevenueByStore,
  getCustomerSegments,
  getBrandHealth,
  getVoucherPerformance,
  getReferralFunnel,
  getOrdersByHour,
  getTopProducts,
} from '@/lib/dashboard/dummy-data'
import ChatPanel from '@/components/ChatPanel'

// ── Constants ────────────────────────────────────────────────────────────────

const STORES = ['Semua', 'PIK Avenue', 'Grand Indonesia', 'Plaza Senayan', 'Pakuwon Surabaya']
const DATE_RANGES = ['7d', '30d', '90d'] as const
type DateRange = typeof DATE_RANGES[number]

const C_PICKUP   = '#650A30'
const C_DELIVERY = '#B8922A'
const C_DINEIN   = '#2B2B2B'
const C_POS      = '#059669'
const C_NEG      = '#DC2626'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)
}

function formatShort(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}rb`
  return String(n)
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 56
  const H = 24
  const step = W / (data.length - 1)

  const points = data
    .map((v, i) => `${i * step},${H - ((v - min) / range) * H}`)
    .join(' ')

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        fill="none"
        stroke={positive ? C_POS : C_NEG}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={H - ((v - min) / range) * H}
          r={i === data.length - 1 ? 2.5 : 1.5}
          fill={positive ? C_POS : C_NEG}
        />
      ))}
    </svg>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string
  value: number
  changePercent: number
  sparklineData: number[]
  format: 'currency' | 'number' | 'percent'
}

function KPICard({ label, value, changePercent, sparklineData, format }: KPICardProps) {
  const positive = changePercent >= 0
  const arrow = positive ? '↑' : '↓'
  const deltaColor = positive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'

  let displayValue: string
  if (format === 'currency') {
    displayValue = formatRupiah(value)
  } else if (format === 'percent') {
    displayValue = `${value.toFixed(1)}%`
  } else {
    displayValue = value.toLocaleString('id-ID')
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
      <p className="text-xl font-bold text-hd-dark leading-none truncate" title={displayValue}>
        {displayValue}
      </p>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${deltaColor}`}>
          {arrow} {Math.abs(changePercent).toFixed(1)}%
        </span>
        <Sparkline data={sparklineData} positive={positive} />
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 px-0 group"
    >
      <h2 className="text-base font-bold text-hd-dark group-hover:text-hd-burgundy transition-colors">
        {title}
      </h2>
      <span className="text-gray-400 text-sm transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        ▾
      </span>
    </button>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function RupiahTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs min-w-[140px]">
      <p className="font-semibold text-hd-dark mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600 capitalize">{p.name}:</span>
          <span className="font-semibold ml-auto pl-2">{formatShort(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function NumberTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-3 text-xs min-w-[120px]">
      <p className="font-semibold text-hd-dark mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600 capitalize">{p.name}:</span>
          <span className="font-semibold ml-auto pl-2">{p.value.toLocaleString('id-ID')}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [range, setRange]   = useState<DateRange>('30d')
  const [store, setStore]   = useState('Semua')
  const [chatOpen, setChatOpen] = useState(false)

  // Section open/close state
  const [sections, setSections] = useState({
    revenue: true,
    customer: true,
    marketing: true,
    ops: true,
  })
  const toggleSection = (key: keyof typeof sections) =>
    setSections((s) => ({ ...s, [key]: !s[key] }))

  // Map range label to the period string dummy-data expects
  const period = range === '7d' ? 'week' : range === '30d' ? 'month' : 'month'

  // Data
  const kpiData          = useMemo(() => getKPIData(period), [period])
  const revenueTS        = useMemo(() => getRevenueTimeSeries(period), [period])
  const revenueByStore   = useMemo(() => getRevenueByStore(), [])
  const customerSegments = useMemo(() => getCustomerSegments(), [])
  const brandHealth      = useMemo(() => getBrandHealth(), [])
  const vouchers         = useMemo(() => getVoucherPerformance(), [])
  const referralFunnel   = useMemo(() => getReferralFunnel(), [])
  const ordersByHour     = useMemo(() => getOrdersByHour(), [])
  const topProducts      = useMemo(() => getTopProducts(), [])

  // Brand health for donut (reshape)
  const brandDonut = [
    { name: 'Full Price', value: brandHealth.fullPrice, color: C_PICKUP },
    { name: 'Voucher',    value: brandHealth.withVoucher, color: C_DELIVERY },
  ]

  // KPI cards config
  const kpiCards: KPICardProps[] = [
    {
      label: 'Total Pendapatan',
      value: kpiData.revenue.current,
      changePercent: kpiData.revenue.changePercent,
      sparklineData: kpiData.revenue.sparklineData,
      format: 'currency',
    },
    {
      label: 'Total Pesanan',
      value: kpiData.orders.current,
      changePercent: kpiData.orders.changePercent,
      sparklineData: kpiData.orders.sparklineData,
      format: 'number',
    },
    {
      label: 'Member Aktif',
      value: kpiData.activeMembers.current,
      changePercent: kpiData.activeMembers.changePercent,
      sparklineData: kpiData.activeMembers.sparklineData,
      format: 'number',
    },
    {
      label: 'Rata-rata Pesanan',
      value: kpiData.aov.current,
      changePercent: kpiData.aov.changePercent,
      sparklineData: kpiData.aov.sparklineData,
      format: 'currency',
    },
    {
      label: 'Redemption Voucher',
      value: kpiData.voucherRedemptionRate.current,
      changePercent: kpiData.voucherRedemptionRate.changePercent,
      sparklineData: kpiData.voucherRedemptionRate.sparklineData,
      format: 'percent',
    },
    {
      label: 'Konversi Referral',
      value: kpiData.referralConversions.current,
      changePercent: kpiData.referralConversions.changePercent,
      sparklineData: kpiData.referralConversions.sparklineData,
      format: 'number',
    },
  ]

  // Voucher sort state
  const [voucherSort, setVoucherSort] = useState<'redemptionRate' | 'roi' | 'redeemed'>('redemptionRate')
  const sortedVouchers = useMemo(
    () => [...vouchers].sort((a, b) => b[voucherSort] - a[voucherSort]),
    [vouchers, voucherSort]
  )

  // Referral funnel max for bar width scaling
  const funnelMax = referralFunnel[0]?.value ?? 1

  // Revenue time series — thin out labels for 90d
  const tsData = revenueTS.slice(-( range === '7d' ? 7 : range === '30d' ? 30 : 90 ))
  const tickEvery = range === '7d' ? 1 : range === '30d' ? 5 : 15

  return (
    <div className="min-h-screen bg-hd-cream">
      {/* ── Sticky Top Bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Title */}
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-hd-burgundy text-xl">✦</span>
            <h1 className="text-base font-bold text-hd-dark">HD Analytics</h1>
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  range === r
                    ? 'bg-hd-burgundy text-white shadow-sm'
                    : 'text-gray-500 hover:text-hd-dark'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Store filter */}
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-hd-dark font-medium focus:outline-none focus:ring-2 focus:ring-hd-burgundy/30 cursor-pointer"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 pb-24">

        {/* ── KPI Cards ── */}
        <div>
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Ringkasan Kinerja</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {kpiCards.map((card) => (
              <KPICard key={card.label} {...card} />
            ))}
          </div>
        </div>

        {/* ── Section: Performa Pendapatan ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-2">
          <SectionHeader
            title="Performa Pendapatan"
            open={sections.revenue}
            onToggle={() => toggleSection('revenue')}
          />
          {sections.revenue && (
            <div className="pb-5 space-y-6">
              {/* Revenue line chart */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Tren Revenue per Channel</p>
                <div className="flex items-center gap-4 mb-3">
                  {[['Pickup', C_PICKUP], ['Delivery', C_DELIVERY], ['Dine-in', C_DINEIN]].map(([label, color]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={tsData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      interval={tickEvery - 1}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatShort(v)}
                      width={40}
                    />
                    <Tooltip content={<RupiahTooltip />} />
                    <Line type="monotone" dataKey="pickup"   stroke={C_PICKUP}   strokeWidth={2} dot={false} name="Pickup" />
                    <Line type="monotone" dataKey="delivery" stroke={C_DELIVERY} strokeWidth={2} dot={false} name="Delivery" />
                    <Line type="monotone" dataKey="dinein"   stroke={C_DINEIN}   strokeWidth={2} dot={false} name="Dine-in" strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue by store bar chart */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Revenue per Toko</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    layout="vertical"
                    data={revenueByStore}
                    margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => formatShort(v)}
                    />
                    <YAxis
                      type="category"
                      dataKey="store"
                      tick={{ fontSize: 11, fill: '#4b5563' }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip content={<RupiahTooltip />} />
                    <Bar dataKey="revenue" fill={C_PICKUP} radius={[0, 4, 4, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Pelanggan & Brand Health ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-2">
          <SectionHeader
            title="Pelanggan & Brand Health"
            open={sections.customer}
            onToggle={() => toggleSection('customer')}
          />
          {sections.customer && (
            <div className="pb-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer segments bar */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Revenue per Tier Loyalitas</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={customerSegments} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="tier"
                        tick={{ fontSize: 11, fill: '#4b5563' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => formatShort(v)}
                        width={38}
                      />
                      <Tooltip content={<RupiahTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                        {customerSegments.map((_, i) => (
                          <Cell
                            key={i}
                            fill={['#650A30', '#801237', '#B8922A', '#2B2B2B'][i % 4]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Brand health donut */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Brand Health — Full Price vs Voucher</p>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={brandDonut}
                          cx="40%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {brandDonut.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [value.toLocaleString('id-ID') + ' pesanan', name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3 min-w-[100px]">
                      {brandDonut.map((d) => {
                        const total = brandDonut.reduce((s, x) => s + x.value, 0)
                        const pct = ((d.value / total) * 100).toFixed(1)
                        return (
                          <div key={d.name} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <div>
                              <p className="text-xs text-gray-500">{d.name}</p>
                              <p className="text-sm font-bold text-hd-dark">{pct}%</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Marketing & Voucher ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-2">
          <SectionHeader
            title="Marketing & Voucher"
            open={sections.marketing}
            onToggle={() => toggleSection('marketing')}
          />
          {sections.marketing && (
            <div className="pb-5 space-y-6">
              {/* Voucher performance table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Performa Voucher</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 mr-1">Urutkan:</span>
                    {(['redemptionRate', 'roi', 'redeemed'] as const).map((key) => (
                      <button
                        key={key}
                        onClick={() => setVoucherSort(key)}
                        className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                          voucherSort === key
                            ? 'bg-hd-burgundy text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {key === 'redemptionRate' ? '% Redeem' : key === 'roi' ? 'ROI' : 'Jumlah'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-400 px-4 py-2.5">Kode</th>
                        <th className="text-left text-xs font-semibold text-gray-400 px-4 py-2.5 hidden md:table-cell">Judul</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">Diterbitkan</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">Digunakan</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">% Redeem</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sortedVouchers.map((v) => (
                        <tr key={v.code} className="hover:bg-hd-cream/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-hd-burgundy">{v.code}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{v.title}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{v.issued.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right font-semibold text-hd-dark">{v.redeemed.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${v.redemptionRate >= 70 ? 'text-emerald-600' : v.redemptionRate >= 50 ? 'text-hd-gold' : 'text-red-500'}`}>
                              {v.redemptionRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`font-semibold ${v.roi >= 2.5 ? 'text-emerald-600' : v.roi >= 1.5 ? 'text-hd-gold' : 'text-red-500'}`}>
                              {v.roi.toFixed(1)}×
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Referral funnel */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Referral Funnel</p>
                <div className="space-y-2">
                  {referralFunnel.map((stage, i) => {
                    const pct = Math.round((stage.value / funnelMax) * 100)
                    const convPct = i > 0
                      ? ((stage.value / referralFunnel[i - 1].value) * 100).toFixed(0)
                      : null
                    return (
                      <div key={stage.stage} className="flex items-center gap-3">
                        <div className="w-36 text-xs text-gray-500 text-right flex-shrink-0 leading-tight">
                          {stage.stage}
                        </div>
                        <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex items-center pl-2 transition-all"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${C_PICKUP}, #801237)`,
                            }}
                          >
                            <span className="text-white text-xs font-bold whitespace-nowrap">
                              {stage.value.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        {convPct && (
                          <span className="text-xs text-gray-400 w-10 flex-shrink-0">{convPct}%</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section: Operasional ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-2">
          <SectionHeader
            title="Operasional"
            open={sections.ops}
            onToggle={() => toggleSection('ops')}
          />
          {sections.ops && (
            <div className="pb-5 space-y-6">
              {/* Orders by hour stacked bar */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Pesanan per Jam</p>
                <div className="flex items-center gap-4 mb-3">
                  {[['Pickup', C_PICKUP], ['Delivery', C_DELIVERY], ['Dine-in', C_DINEIN]].map(([label, color]) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                      {label}
                    </span>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ordersByHour} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}:00`}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip content={<NumberTooltip />} />
                    <Bar dataKey="pickup"   stackId="a" fill={C_PICKUP}   name="Pickup" />
                    <Bar dataKey="delivery" stackId="a" fill={C_DELIVERY} name="Delivery" />
                    <Bar dataKey="dinein"   stackId="a" fill={C_DINEIN}   name="Dine-in" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 products table */}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Top 10 Produk</p>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-center text-xs font-semibold text-gray-400 px-4 py-2.5 w-10">#</th>
                        <th className="text-left text-xs font-semibold text-gray-400 px-4 py-2.5">Produk</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">Pesanan</th>
                        <th className="text-right text-xs font-semibold text-gray-400 px-4 py-2.5">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topProducts.slice(0, 10).map((p, i) => (
                        <tr key={p.name} className="hover:bg-hd-cream/50 transition-colors">
                          <td className="px-4 py-3 text-center">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${
                              i === 0 ? 'bg-hd-gold/20 text-hd-gold' :
                              i === 1 ? 'bg-gray-200 text-gray-600' :
                              i === 2 ? 'bg-orange-100 text-orange-600' :
                              'text-gray-400'
                            }`}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-hd-dark">{p.name}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{p.orders.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right font-semibold text-hd-dark">{formatShort(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-hd-burgundy text-white shadow-lg hover:bg-hd-burgundy-dark active:scale-95 transition-all flex items-center justify-center"
        aria-label="Buka HD Insights"
      >
        <span className="text-xl">✦</span>
      </button>

      {/* ── Chat Panel ── */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}
