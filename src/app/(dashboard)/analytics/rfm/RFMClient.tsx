'use client'

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import FilterBar, { type FilterBarStore } from '@/components/analytics/FilterBar'
import type { CustomerRFM, RFMData, RFMSegment, ScoreBand } from '@/lib/dashboard/real-metrics'

// ── Theme ──────────────────────────────────────────────────────────────
const DC = {
  bg:            '#1C0810',
  card:          '#2A0F1C',
  border:        'rgba(184,146,42,0.18)',
  divider:       'rgba(254,242,227,0.08)',
  gold:          '#B8922A',
  textPrimary:   '#FEF2E3',
  textSecondary: 'rgba(254,242,227,0.65)',
  textMuted:     'rgba(254,242,227,0.4)',
}

const SEGMENT_COLORS: Record<RFMSegment, string> = {
  'Champions':           '#B8922A',
  'Loyal':               '#D4AC3A',
  'Potential Loyalists': '#9B4D78',
  'New Customers':       '#4ECDC4',
  'Promising':           '#5BA3A0',
  'Needs Attention':     '#C9A86C',
  'At Risk':             '#D96C6C',
  'Cannot Lose':         '#E74C3C',
  'Hibernating':         '#7B6A5C',
  'Lost':                '#4A3728',
}

// ── CRM playbook actions per segment ──────────────────────────────────
const SEGMENT_ACTIONS: Record<RFMSegment, { criteria: string; action: string; urgency: 'high' | 'medium' | 'low' }> = {
  'Champions':           { criteria: 'R ≥ 4  ·  F ≥ 4  ·  M ≥ 4', action: 'VIP program, early access to new flavours, referral incentives. No discounts — they pay full price.', urgency: 'low' },
  'Loyal':               { criteria: 'R ≥ 2  ·  F ≥ 3  ·  M ≥ 3', action: 'Cross-sell premium toppings, reward milestones, mid-tier loyalty perks.', urgency: 'low' },
  'Potential Loyalists': { criteria: 'R ≥ 3  ·  F ≤ 3  ·  M ≥ 2', action: 'Incentivise 2nd/3rd order, bundle deals, loyalty programme sign-up.', urgency: 'medium' },
  'New Customers':       { criteria: 'R ≥ 4  ·  F ≤ 1',             action: 'Welcome offer, onboarding into loyalty, educate on best-sellers.', urgency: 'medium' },
  'Promising':           { criteria: 'R ≥ 3  ·  F ≤ 2',             action: 'Seasonal nudge, bundle discount to raise order frequency.', urgency: 'medium' },
  'Needs Attention':     { criteria: 'R ≥ 2  ·  F ≥ 2',             action: 'Re-engagement message, product update email, soft offer.', urgency: 'medium' },
  'At Risk':             { criteria: 'R ≤ 2  ·  F ≥ 2  ·  M ≥ 2',  action: 'Win-back campaign: personal email/SMS + limited-time offer after 21–30 days of silence.', urgency: 'high' },
  'Cannot Lose':         { criteria: 'R ≤ 1  ·  F ≥ 4',             action: 'URGENT — big spenders gone dormant. Bold incentive + personal outreach within 1 week.', urgency: 'high' },
  'Hibernating':         { criteria: 'R ≤ 2  ·  F ≤ 2',             action: 'Quarterly win-back series, seasonal offer, minimal spend.', urgency: 'low' },
  'Lost':                { criteria: 'R ≤ 1  ·  F ≤ 1',             action: 'Exclude from paid campaigns. One-time win-back attempt; if no response, sunset.', urgency: 'low' },
}

// ── Helpers ────────────────────────────────────────────────────────────
function rupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${Math.round(n)}`
}

function fmtDays(d: number) {
  if (d === 0) return 'today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

/** Format a ScoreBand entry as a human-readable range string. */
function bandLabel(band: ScoreBand, score: number, unit: 'days' | 'orders' | 'money'): string {
  const b = band[score]
  if (!b) return '—'
  const fmt = (v: number) => unit === 'money' ? rupiah(v) : unit === 'days' ? `${v}d` : `${v}`
  if (b.min === b.max) return fmt(b.min)
  return `${fmt(b.min)} – ${fmt(b.max)}`
}

// ── Score pip visual ───────────────────────────────────────────────────
function ScorePip({ score }: { score: number }) {
  return (
    <span className="inline-flex gap-[3px] items-center">
      {[1,2,3,4,5].map(i => (
        <span key={i} className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: i <= score ? DC.gold : 'rgba(254,242,227,0.15)' }} />
      ))}
    </span>
  )
}

// ── Segment bubble type ────────────────────────────────────────────────
type SegmentBubble = {
  name: RFMSegment; count: number; revenue: number
  avgMonetary: number; avgR: number; avgF: number; color: string
}

// ── Scatter tooltip ────────────────────────────────────────────────────
function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: SegmentBubble }> }) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }} className="px-3 py-2.5 shadow-xl text-xs min-w-[170px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        <p style={{ color: s.color }} className="font-display font-semibold">{s.name}</p>
      </div>
      <div className="space-y-1" style={{ color: DC.textMuted }}>
        <p>Customers: <span className="numeral font-semibold" style={{ color: DC.textPrimary }}>{s.count}</span></p>
        <p>Avg Recency score: <span className="numeral" style={{ color: DC.textPrimary }}>{s.avgR.toFixed(1)} / 5</span></p>
        <p>Avg Frequency score: <span className="numeral" style={{ color: DC.textPrimary }}>{s.avgF.toFixed(1)} / 5</span></p>
        <p>Avg spend: <span className="numeral" style={{ color: DC.gold }}>{rupiah(s.avgMonetary)}</span></p>
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────
export default function RFMClient({ data, stores }: { data: RFMData; stores: FilterBarStore[] }) {
  const [sortCol, setSortCol] = useState<keyof CustomerRFM>('monetary')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterSeg, setFilterSeg] = useState<RFMSegment | 'All'>('All')
  const [search, setSearch] = useState('')
  const [showRules, setShowRules] = useState(false)

  const { customers, segments, totals, thresholds } = data

  // Segment bubbles for scatter
  const segmentBubbles = useMemo<SegmentBubble[]>(() => segments.map(seg => {
    const sc = customers.filter(c => c.segment === seg.name)
    return {
      name: seg.name, count: seg.count, revenue: seg.revenue,
      avgMonetary: seg.count > 0 ? seg.revenue / seg.count : 0,
      avgR: sc.length ? sc.reduce((s, c) => s + c.rScore, 0) / sc.length : 0,
      avgF: sc.length ? sc.reduce((s, c) => s + c.fScore, 0) / sc.length : 0,
      color: seg.color,
    }
  }).filter(s => s.count > 0), [customers, segments])

  const maxBubbleCount = Math.max(1, ...segmentBubbles.map(s => s.count))

  // Filtered customer table
  const filtered = useMemo(() => {
    let list = filterSeg === 'All' ? customers : customers.filter(c => c.segment === filterSeg)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      const av = a[sortCol] as number | string
      const bv = b[sortCol] as number | string
      if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
  }, [customers, filterSeg, search, sortCol, sortAsc])

  function toggleSort(col: keyof CustomerRFM) {
    if (sortCol === col) setSortAsc(!sortAsc)
    else { setSortCol(col); setSortAsc(false) }
  }

  const maxSegCount = Math.max(1, ...segments.map(s => s.count))
  const totalRevenue = totals.totalRevenue || 1
  const championPct = totals.customers > 0 ? ((totals.champions / totals.customers) * 100).toFixed(0) : '0'
  const atRiskPct   = totals.customers > 0 ? ((totals.atRisk   / totals.customers) * 100).toFixed(0) : '0'
  const cannotLoseSeg = segments.find(s => s.name === 'Cannot Lose')
  const smallSample = data.sampleSize < 50

  const computedDate = new Date(data.computedAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: DC.bg, color: DC.textPrimary }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(28,8,16,0.92)', borderBottom: `1px solid ${DC.divider}` }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5 pb-0">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <span className="eyebrow" style={{ color: DC.gold }}>HD Analytics</span>
              <h1 className="font-display text-[1.9rem] tracking-editorial mt-0.5" style={{ color: DC.textPrimary }}>
                Customer <span className="italic">RFM</span>
              </h1>
              <p className="text-[0.72rem] mt-0.5" style={{ color: DC.textMuted }}>
                Recency · Frequency · Monetary · all-time orders
                &nbsp;·&nbsp;
                <span style={{ color: DC.textSecondary }}>Computed {computedDate}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 pb-1 flex-wrap">
              <div style={{ border: `1px solid ${DC.border}` }} className="px-3 py-1.5 text-xs">
                <span style={{ color: DC.textMuted }}>Customers&nbsp;</span>
                <span className="numeral font-semibold" style={{ color: DC.textPrimary }}>{totals.customers}</span>
              </div>
              <div style={{ border: `1px solid ${DC.border}` }} className="px-3 py-1.5 text-xs">
                <span style={{ color: DC.textMuted }}>Method&nbsp;</span>
                <span style={{ color: DC.gold }}>Quintile scoring</span>
              </div>
            </div>
          </div>
          <div className="mt-5"><AnalyticsTabs /></div>
          <FilterBar stores={stores} show={{ period: false, stores: false, channels: false, gift: false, tiers: true }} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-10">

        {/* ── 00 · Strategic Insights ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>00</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Strategic <span className="italic">insights</span></h2>
            <span className="text-[0.7rem] ml-auto" style={{ color: DC.textMuted }}>Read this first</span>
          </div>

          {/* Small sample warning */}
          {smallSample && (
            <div className="mb-3 px-4 py-3 text-xs leading-relaxed"
              style={{ backgroundColor: 'rgba(184,146,42,0.08)', border: `1px solid rgba(184,146,42,0.3)`, borderLeft: `3px solid ${DC.gold}` }}>
              <span style={{ color: DC.gold }} className="font-semibold">Small dataset notice — </span>
              <span style={{ color: DC.textSecondary }}>
                With {data.sampleSize} customers, each quintile band contains only ~{Math.round(data.sampleSize / 5)} people.
                Scores are statistically fragile — adding or removing one customer can shift multiple people between tiers.
                Treat segment assignments as directional guidance, not precise classification.
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            {/* Cannot Lose — most urgent */}
            {cannotLoseSeg && cannotLoseSeg.count > 0 && (
              <div className="px-4 py-3 text-xs leading-relaxed"
                style={{ backgroundColor: 'rgba(231,76,60,0.08)', border: `1px solid rgba(231,76,60,0.25)`, borderLeft: `3px solid #E74C3C` }}>
                <span className="font-semibold" style={{ color: '#E74C3C' }}>🚨 Cannot Lose — {cannotLoseSeg.count} customer{cannotLoseSeg.count !== 1 ? 's' : ''} · {rupiah(cannotLoseSeg.revenue)} revenue — </span>
                <span style={{ color: DC.textSecondary }}>
                  These were your most frequent buyers but have gone fully dormant. Personal re-engagement (call/WhatsApp) + bold incentive needed within 1 week.
                </span>
              </div>
            )}

            {/* At Risk */}
            {totals.atRisk > 0 && (
              <div className="px-4 py-3 text-xs leading-relaxed"
                style={{ backgroundColor: 'rgba(217,108,108,0.08)', border: `1px solid rgba(217,108,108,0.25)`, borderLeft: `3px solid #D96C6C` }}>
                <span className="font-semibold" style={{ color: '#D96C6C' }}>⚠ At Risk — {totals.atRisk} customer{totals.atRisk !== 1 ? 's' : ''} ({atRiskPct}% of base) · {rupiah(totals.atRiskRevenue)} revenue — </span>
                <span style={{ color: DC.textSecondary }}>
                  Previously active buyers now lapsing. Win-back email + limited-time offer within the next 2 weeks before they become Lost.
                </span>
              </div>
            )}

            {/* Champions opportunity */}
            {totals.champions > 0 && (
              <div className="px-4 py-3 text-xs leading-relaxed"
                style={{ backgroundColor: 'rgba(184,146,42,0.08)', border: `1px solid rgba(184,146,42,0.25)`, borderLeft: `3px solid ${DC.gold}` }}>
                <span className="font-semibold" style={{ color: DC.gold }}>✦ Champions — {totals.champions} customer{totals.champions !== 1 ? 's' : ''} ({championPct}%) drive {((totals.championRevenue / totalRevenue) * 100).toFixed(0)}% of total revenue — </span>
                <span style={{ color: DC.textSecondary }}>
                  Protect and deepen this group. VIP perks, early access, referral rewards. Do NOT discount — they buy at full price.
                </span>
              </div>
            )}

            {/* Healthy baseline */}
            {totals.atRisk === 0 && !cannotLoseSeg?.count && (
              <div className="px-4 py-3 text-xs" style={{ backgroundColor: DC.card, border: `1px solid ${DC.divider}`, color: DC.textMuted }}>
                No critical segments detected. Continue standard retention cadence.
              </div>
            )}
          </div>
        </section>

        {/* ── 01 · Segment KPIs ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>01</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Segment <span className="italic">snapshot</span></h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Champions',  value: totals.champions, sub: `${championPct}% of base`, rev: rupiah(totals.championRevenue), color: SEGMENT_COLORS['Champions'] },
              { label: 'Loyal',      value: totals.loyal,     sub: 'repeat buyers',           rev: '',                              color: SEGMENT_COLORS['Loyal'] },
              { label: 'At Risk',    value: totals.atRisk,    sub: `${atRiskPct}% of base`,   rev: rupiah(totals.atRiskRevenue),    color: SEGMENT_COLORS['At Risk'] },
              { label: 'Lost',       value: totals.lost,      sub: 'need win-back',            rev: '',                              color: SEGMENT_COLORS['Lost'] },
            ].map(card => (
              <div key={card.label} className="p-5" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
                <p className="eyebrow" style={{ color: DC.textMuted }}>{card.label}</p>
                <p className="numeral text-[2.5rem] leading-none mt-2" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[0.72rem] mt-1.5" style={{ color: DC.textMuted }}>{card.sub}</p>
                {card.rev && <p className="numeral text-[0.8rem] mt-1" style={{ color: DC.textSecondary }}>{card.rev} revenue</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: 'Avg recency',   value: `${data.avgRecencyDays}d`,   sub: 'days since last order' },
              { label: 'Avg frequency', value: `${data.avgFrequency}`,       sub: 'orders per customer' },
              { label: 'Avg spend',     value: rupiah(data.avgMonetary),     sub: 'lifetime per customer' },
            ].map(s => (
              <div key={s.label} className="p-4" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
                <p className="eyebrow" style={{ color: DC.textMuted }}>{s.label}</p>
                <p className="numeral text-[1.6rem] mt-1" style={{ color: DC.textPrimary }}>{s.value}</p>
                <p className="text-[0.7rem] mt-0.5" style={{ color: DC.textMuted }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── RFM Score Key with ACTUAL computed thresholds ── */}
          <div className="mt-3 p-5" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow" style={{ color: DC.gold }}>
                How scores work  ·  Quintile ranking  ·  1 = bottom 20%  ·  5 = top 20%
              </p>
              <span className="text-[0.65rem]" style={{ color: DC.textMuted }}>Computed from your live data</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  letter: 'R',
                  name: 'Recency',
                  desc: 'Days since their most recent order',
                  unit: 'days' as const,
                  bands: thresholds.r,
                  note: 'Lower = better (score 5 = bought recently)',
                  flip: true,
                },
                {
                  letter: 'F',
                  name: 'Frequency',
                  desc: 'Total number of orders placed',
                  unit: 'orders' as const,
                  bands: thresholds.f,
                  note: 'Higher = better (score 5 = orders most often)',
                  flip: false,
                },
                {
                  letter: 'M',
                  name: 'Monetary',
                  desc: 'Lifetime spend across all orders',
                  unit: 'money' as const,
                  bands: thresholds.m,
                  note: 'Higher = better (score 5 = highest spender)',
                  flip: false,
                },
              ].map(dim => (
                <div key={dim.letter}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display italic text-[1.5rem] leading-none" style={{ color: DC.gold }}>{dim.letter}</span>
                    <span className="font-display text-[1rem]" style={{ color: DC.textPrimary }}>{dim.name}</span>
                  </div>
                  <p className="text-[0.72rem] mb-3" style={{ color: DC.textMuted }}>{dim.desc}</p>
                  {/* Score rows 5→1 with actual values */}
                  <div className="space-y-1.5">
                    {(dim.flip ? [5,4,3,2,1] : [5,4,3,2,1]).map(score => {
                      const b = dim.bands[score]
                      return (
                        <div key={score} className="flex items-center gap-2">
                          <span className="numeral text-[0.65rem] w-4 text-right shrink-0"
                            style={{ color: score === 5 ? DC.gold : score === 1 ? DC.textMuted : DC.textSecondary }}>
                            {score}
                          </span>
                          <ScorePip score={score} />
                          {b ? (
                            <span className="numeral text-[0.7rem]"
                              style={{ color: score === 5 ? DC.textPrimary : score === 1 ? DC.textMuted : DC.textSecondary }}>
                              {dim.unit === 'days'
                                ? (b.min === b.max ? `${b.min}d ago` : `${b.min}–${b.max}d ago`)
                                : dim.unit === 'orders'
                                  ? (b.min === b.max ? `${b.min} order${b.min !== 1 ? 's' : ''}` : `${b.min}–${b.max} orders`)
                                  : (b.min === b.max ? rupiah(b.min) : `${rupiah(b.min)} – ${rupiah(b.max)}`)}
                            </span>
                          ) : (
                            <span className="text-[0.65rem]" style={{ color: DC.textMuted }}>no data</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-[0.62rem] mt-2 italic" style={{ color: DC.textMuted }}>{dim.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 02 · Bubble Chart ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>02</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Recency vs <span className="italic">Frequency</span></h2>
            <span className="text-[0.7rem] ml-2" style={{ color: DC.textMuted }}>bubble size = no. of customers in segment</span>
          </div>
          <div className="p-6" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 35, left: 10 }}>
                <CartesianGrid stroke={DC.divider} strokeDasharray="2 4" />
                <XAxis dataKey="avgR" type="number" domain={[0, 6]} ticks={[1,2,3,4,5]}
                  tick={{ fill: DC.textMuted, fontSize: 11 }}
                  label={{ value: 'Recency Score  (1 = bought long ago  ·  5 = bought recently)', position: 'insideBottom', offset: -20, fill: DC.textMuted, fontSize: 10 }} />
                <YAxis dataKey="avgF" type="number" domain={[0, 6]} ticks={[1,2,3,4,5]}
                  tick={{ fill: DC.textMuted, fontSize: 11 }}
                  label={{ value: 'Frequency Score  (1 = rare  ·  5 = very frequent)', angle: -90, position: 'insideLeft', offset: 18, fill: DC.textMuted, fontSize: 10 }} />
                <Tooltip content={<ScatterTooltip />} cursor={false} />
                {/* shape prop is the only way Recharts respects per-point radius in ScatterChart */}
                <Scatter
                  data={segmentBubbles}
                  isAnimationActive={false}
                  shape={(props: { cx?: number; cy?: number; payload?: SegmentBubble }) => {
                    const { cx = 0, cy = 0, payload } = props
                    if (!payload) return <circle cx={cx} cy={cy} r={0} />
                    // Area-proportional radius: sqrt scaling so visual area = count
                    const r = Math.max(10, Math.round(Math.sqrt(payload.count / maxBubbleCount) * 58))
                    return (
                      <circle
                        cx={cx} cy={cy} r={r}
                        fill={payload.color} fillOpacity={0.72}
                        stroke={payload.color} strokeOpacity={0.5} strokeWidth={2}
                      />
                    )
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-3" style={{ borderTop: `1px solid ${DC.divider}` }}>
              {segmentBubbles.slice().sort((a, b) => b.count - a.count).map(seg => (
                <button key={seg.name}
                  onClick={() => setFilterSeg(filterSeg === seg.name ? 'All' : seg.name)}
                  className="flex items-center gap-2 text-[0.72rem] transition-opacity"
                  style={{ opacity: filterSeg !== 'All' && filterSeg !== seg.name ? 0.3 : 1 }}>
                  <span className="rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color, opacity: 0.8,
                      width:  Math.max(8, Math.round((seg.count / maxBubbleCount) * 20)),
                      height: Math.max(8, Math.round((seg.count / maxBubbleCount) * 20)) }} />
                  <span style={{ color: DC.textSecondary }}>{seg.name}</span>
                  <span className="numeral" style={{ color: DC.textMuted }}>({seg.count})</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 03 · Segment Breakdown + Actions ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>03</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Segment <span className="italic">breakdown</span></h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-6 space-y-3" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
              <p className="text-xs font-semibold mb-4" style={{ color: DC.textSecondary }}>Customer count</p>
              {segments.map(s => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[0.8rem]" style={{ color: DC.textPrimary }}>{s.name}</span>
                    <span className="numeral text-[0.75rem]" style={{ color: DC.textMuted }}>{s.count}</span>
                  </div>
                  <div className="h-[5px] rounded-full" style={{ backgroundColor: DC.divider }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(s.count / maxSegCount) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 space-y-3" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
              <p className="text-xs font-semibold mb-4" style={{ color: DC.textSecondary }}>Revenue contribution</p>
              {(() => {
                const maxRev = Math.max(1, ...segments.map(s => s.revenue))
                return segments.slice().sort((a, b) => b.revenue - a.revenue).map(s => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.8rem]" style={{ color: DC.textPrimary }}>{s.name}</span>
                      <span className="numeral text-[0.75rem]" style={{ color: DC.gold }}>{rupiah(s.revenue)}</span>
                    </div>
                    <div className="h-[5px] rounded-full" style={{ backgroundColor: DC.divider }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(s.revenue / maxRev) * 100}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Segment rules + CRM actions */}
          <div className="mt-4">
            <button onClick={() => setShowRules(!showRules)}
              className="flex items-center gap-2 text-xs mb-3 transition-opacity hover:opacity-80"
              style={{ color: DC.gold }}>
              <span>{showRules ? '▾' : '▸'}</span>
              <span>{showRules ? 'Hide' : 'Show'} segment criteria &amp; recommended actions</span>
            </button>
            {showRules && (
              <div className="grid lg:grid-cols-2 gap-3">
                {(Object.entries(SEGMENT_ACTIONS) as [RFMSegment, typeof SEGMENT_ACTIONS[RFMSegment]][])
                  .filter(([name]) => segments.some(s => s.name === name))
                  .map(([name, info]) => {
                    const color = SEGMENT_COLORS[name]
                    const urgencyBorder = info.urgency === 'high' ? '3px' : '1px'
                    return (
                      <div key={name} className="p-4"
                        style={{ backgroundColor: `${color}0D`, borderLeft: `${urgencyBorder} solid ${color}`, border: `1px solid ${color}22` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display text-[0.9rem]" style={{ color }}>{name}</span>
                          {info.urgency === 'high' && (
                            <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: `${color}22`, color }}>URGENT</span>
                          )}
                        </div>
                        <p className="numeral text-[0.65rem] mb-2" style={{ color: DC.textMuted }}>{info.criteria}</p>
                        <p className="text-[0.75rem] leading-relaxed" style={{ color: DC.textSecondary }}>{info.action}</p>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </section>

        {/* ── 04 · R×F Heatmap ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>04</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">R × F <span className="italic">heatmap</span></h2>
            <span className="text-[0.7rem] ml-2" style={{ color: DC.textMuted }}>how many customers per score combination</span>
          </div>
          <div className="p-6 overflow-x-auto" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            {(() => {
              const grid: number[][] = Array.from({ length: 5 }, () => new Array(5).fill(0))
              customers.forEach(c => {
                grid[4 - Math.min(4, c.fScore - 1)][Math.min(4, c.rScore - 1)] += 1
              })
              const maxCell = Math.max(1, ...grid.flat())
              return (
                <div className="min-w-[460px]">
                  <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                    <div className="text-right pr-2 text-[0.65rem]" style={{ color: DC.textMuted }}>
                      <div>F score ↑</div>
                      <div className="italic">(frequency)</div>
                    </div>
                    {[1,2,3,4,5].map(r => (
                      <div key={r} className="text-center">
                        <div className="numeral text-[0.7rem]" style={{ color: DC.textMuted }}>R = {r}</div>
                        <div className="text-[0.6rem]" style={{ color: DC.textMuted }}>
                          {thresholds.r[r] ? (r <= 2 ? 'old' : r >= 4 ? 'recent' : '') : ''}
                        </div>
                        {thresholds.r[r] && (
                          <div className="numeral text-[0.6rem]" style={{ color: `rgba(184,146,42,0.6)` }}>
                            {thresholds.r[r]!.min === thresholds.r[r]!.max
                              ? `${thresholds.r[r]!.min}d`
                              : `${thresholds.r[r]!.min}–${thresholds.r[r]!.max}d`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {grid.map((row, rowIdx) => {
                    const fLabel = 5 - rowIdx
                    const fBand = thresholds.f[fLabel]
                    return (
                      <div key={rowIdx} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                        <div className="flex flex-col justify-center text-right pr-2">
                          <span className="numeral text-[0.7rem]" style={{ color: DC.textMuted }}>F = {fLabel}</span>
                          {fBand && (
                            <span className="numeral text-[0.6rem]" style={{ color: `rgba(184,146,42,0.6)` }}>
                              {fBand.min === fBand.max ? `${fBand.min}x` : `${fBand.min}–${fBand.max}x`}
                            </span>
                          )}
                        </div>
                        {row.map((val, colIdx) => {
                          const intensity = val / maxCell
                          const bg = intensity === 0 ? 'rgba(42,15,28,0.4)' : `rgba(184,146,42,${0.1 + intensity * 0.9})`
                          return (
                            <div key={colIdx}
                              className="aspect-square flex items-center justify-center numeral text-[0.75rem] rounded-sm hover:scale-105 transition-transform cursor-default"
                              style={{ backgroundColor: bg, color: intensity > 0.4 ? '#1C0810' : DC.textSecondary }}
                              title={`R=${colIdx + 1}, F=${fLabel}: ${val} customer${val !== 1 ? 's' : ''}`}>
                              {val > 0 ? val : ''}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <span className="text-[0.65rem]" style={{ color: DC.textMuted }}>0 customers</span>
                    {[0.1, 0.3, 0.55, 0.75, 1].map((op, i) => (
                      <div key={i} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(184,146,42,${op})` }} />
                    ))}
                    <span className="text-[0.65rem]" style={{ color: DC.textMuted }}>many</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </section>

        {/* ── 05 · Customer Ledger ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>05</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Customer <span className="italic">ledger</span></h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input type="text" placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 px-3 text-xs bg-transparent focus:outline-none"
              style={{ border: `1px solid ${DC.border}`, color: DC.textPrimary, minWidth: 200 }} />
            <div className="flex flex-wrap gap-2">
              {(['All', ...segments.map(s => s.name)] as (RFMSegment | 'All')[]).map(seg => (
                <button key={seg} onClick={() => setFilterSeg(seg)}
                  className="px-2.5 py-1 text-[0.65rem] transition-all rounded-full"
                  style={{
                    backgroundColor: filterSeg === seg ? (seg === 'All' ? DC.gold : SEGMENT_COLORS[seg as RFMSegment]) : 'transparent',
                    color: filterSeg === seg ? '#1C0810' : DC.textMuted,
                    border: `1px solid ${filterSeg === seg ? (seg === 'All' ? DC.gold : SEGMENT_COLORS[seg as RFMSegment]) : DC.divider}`,
                  }}>
                  {seg}
                </button>
              ))}
            </div>
            <span className="numeral text-[0.7rem] ml-auto" style={{ color: DC.textMuted }}>
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto" style={{ border: `1px solid ${DC.border}` }}>
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${DC.divider}` }}>
                  {([
                    { key: 'name',        label: 'Customer',       title: 'Name and email' },
                    { key: 'segment',     label: 'Segment',        title: 'RFM segment assigned by quintile scoring' },
                    { key: 'rScore',      label: 'R — Recency',    title: 'Score 1–5. 5 = bought most recently. Based on days since last order.' },
                    { key: 'fScore',      label: 'F — Frequency',  title: 'Score 1–5. 5 = most orders placed. Based on total order count.' },
                    { key: 'mScore',      label: 'M — Spend',      title: 'Score 1–5. 5 = highest lifetime spender.' },
                    { key: 'recencyDays', label: 'Last order',     title: 'Days since their most recent order' },
                    { key: 'frequency',   label: 'Orders',         title: 'Total orders placed (all-time)' },
                    { key: 'monetary',    label: 'Lifetime spend', title: 'Total revenue from this customer (all orders)' },
                    { key: 'tier',        label: 'Tier',           title: 'Loyalty tier: silver / gold / platinum' },
                  ] as { key: keyof CustomerRFM; label: string; title: string }[]).map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} title={col.title}
                      className="text-left py-3 px-3 font-medium cursor-pointer select-none hover:opacity-80 whitespace-nowrap"
                      style={{ color: sortCol === col.key ? DC.gold : DC.textMuted }}>
                      {col.label}{sortCol === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-10 text-center font-display italic" style={{ color: DC.textMuted }}>No customers match.</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.userId} style={{ borderBottom: `1px solid ${DC.divider}` }}
                    className="transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="py-3 px-3">
                      <p className="font-display" style={{ color: DC.textPrimary }}>{c.name}</p>
                      <p className="numeral text-[0.65rem] mt-0.5" style={{ color: DC.textMuted }}>{c.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-full whitespace-nowrap"
                        style={{ backgroundColor: `${SEGMENT_COLORS[c.segment]}22`, color: SEGMENT_COLORS[c.segment], border: `1px solid ${SEGMENT_COLORS[c.segment]}44` }}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3 px-3" title={`${c.recencyDays} days since last order`}><ScorePip score={c.rScore} /></td>
                    <td className="py-3 px-3" title={`${c.frequency} total orders`}><ScorePip score={c.fScore} /></td>
                    <td className="py-3 px-3" title={rupiah(c.monetary)}><ScorePip score={c.mScore} /></td>
                    <td className="py-3 px-3 numeral"
                      style={{ color: c.recencyDays <= 7 ? '#4ECDC4' : c.recencyDays <= 30 ? DC.textSecondary : DC.textMuted }}>
                      {c.recencyDays === 0 ? 'Today' : `${c.recencyDays}d ago`}
                    </td>
                    <td className="py-3 px-3 numeral text-center" style={{ color: DC.textSecondary }}>{c.frequency}</td>
                    <td className="py-3 px-3 numeral font-semibold" style={{ color: DC.gold }}>{rupiah(c.monetary)}</td>
                    <td className="py-3 px-3 capitalize text-[0.65rem]" style={{ color: DC.textMuted }}>{c.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Methodology footnote */}
          <p className="text-[0.65rem] mt-4 leading-relaxed" style={{ color: DC.textMuted }}>
            <span style={{ color: DC.textSecondary }}>Scoring method:</span> Quintile ranking — customers are sorted per dimension and divided into 5 equal bands.
            Score 5 = top 20%, Score 1 = bottom 20%. With {data.sampleSize} customers each band holds ~{Math.round(data.sampleSize / 5)} people;
            boundaries shift when new orders arrive. Not K-means — no clustering algorithm is applied.
            {smallSample && ' Due to the small sample, treat segments as directional, not definitive.'}
          </p>
        </section>

      </main>
    </div>
  )
}
