'use client'

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import type { CustomerRFM, RFMData, RFMSegment } from '@/lib/dashboard/real-metrics'

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

// ── Helpers ────────────────────────────────────────────────────────────
function rupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`
  return `Rp ${Math.round(n)}`
}

// ── Score pip visual (1-5 dots) ────────────────────────────────────────
function ScorePip({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'
  return (
    <span className="inline-flex gap-[3px] items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`inline-block ${dim} rounded-full`}
          style={{ backgroundColor: i <= score ? DC.gold : 'rgba(254,242,227,0.15)' }}
        />
      ))}
    </span>
  )
}

// ── Aggregate per-segment data for the scatter bubble chart ────────────
type SegmentBubble = {
  name: RFMSegment
  count: number
  revenue: number
  avgMonetary: number
  avgR: number   // average R score (1-5) of customers in this segment
  avgF: number   // average F score (1-5)
  color: string
}

// ── Scatter tooltip (shows segment-level data) ─────────────────────────
function ScatterTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: SegmentBubble }>
}) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  return (
    <div style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }} className="px-3 py-2.5 shadow-xl text-xs min-w-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        <p style={{ color: s.color }} className="font-display font-semibold">{s.name}</p>
      </div>
      <div className="space-y-1" style={{ color: DC.textMuted }}>
        <p>Customers: <span style={{ color: DC.textPrimary }} className="numeral font-semibold">{s.count}</span></p>
        <p>Avg Recency score: <span style={{ color: DC.textPrimary }} className="numeral">{s.avgR.toFixed(1)}</span></p>
        <p>Avg Frequency score: <span style={{ color: DC.textPrimary }} className="numeral">{s.avgF.toFixed(1)}</span></p>
        <p>Avg spend: <span style={{ color: DC.gold }} className="numeral">{rupiah(s.avgMonetary)}</span></p>
      </div>
    </div>
  )
}

// ── Main client component ──────────────────────────────────────────────
export default function RFMClient({ data }: { data: RFMData }) {
  const [sortCol, setSortCol] = useState<keyof CustomerRFM>('monetary')
  const [sortAsc, setSortAsc] = useState(false)
  const [filterSeg, setFilterSeg] = useState<RFMSegment | 'All'>('All')
  const [search, setSearch] = useState('')

  const { customers, segments, totals } = data

  // ── Aggregate customers per segment for bubble chart ──────────────
  const segmentBubbles = useMemo<SegmentBubble[]>(() => {
    return segments
      .map(seg => {
        const sc = customers.filter(c => c.segment === seg.name)
        if (sc.length === 0) return null
        return {
          name: seg.name,
          count: seg.count,
          revenue: seg.revenue,
          avgMonetary: seg.count > 0 ? seg.revenue / seg.count : 0,
          avgR: sc.reduce((s, c) => s + c.rScore, 0) / sc.length,
          avgF: sc.reduce((s, c) => s + c.fScore, 0) / sc.length,
          color: seg.color,
        } satisfies SegmentBubble
      })
      .filter(Boolean) as SegmentBubble[]
  }, [customers, segments])

  const maxBubbleCount = Math.max(1, ...segmentBubbles.map(s => s.count))

  // ── Filtered + sorted customer table ──────────────────────────────
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
  const championPct = totals.customers > 0 ? ((totals.champions / totals.customers) * 100).toFixed(0) : '0'
  const atRiskPct   = totals.customers > 0 ? ((totals.atRisk   / totals.customers) * 100).toFixed(0) : '0'

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: DC.bg, color: DC.textPrimary }}>

      {/* ── Sticky Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(28,8,16,0.9)', borderBottom: `1px solid ${DC.divider}` }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-6 pb-0">
          <div className="flex items-baseline justify-between flex-wrap gap-3">
            <div>
              <span className="eyebrow" style={{ color: DC.gold }}>HD Analytics</span>
              <h1 className="font-display text-[2rem] tracking-editorial mt-1" style={{ color: DC.textPrimary }}>
                Customer <span className="italic">RFM</span>
              </h1>
              <p className="text-[0.75rem] mt-1" style={{ color: DC.textMuted }}>
                Recency · Frequency · Monetary · all-time data
              </p>
            </div>
            <div className="flex items-center gap-3 pb-1">
              <div style={{ border: `1px solid ${DC.border}` }} className="px-3 py-1.5 text-xs">
                <span style={{ color: DC.textMuted }}>Customers&nbsp;</span>
                <span style={{ color: DC.textPrimary }} className="numeral font-semibold">{totals.customers}</span>
              </div>
              <div style={{ border: `1px solid ${DC.border}` }} className="px-3 py-1.5 text-xs">
                <span style={{ color: DC.textMuted }}>Avg spend&nbsp;</span>
                <span style={{ color: DC.gold }} className="numeral font-semibold">{rupiah(data.avgMonetary)}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <AnalyticsTabs />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 space-y-10">

        {/* ── 01 · Segment KPI Cards ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>01</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Segment <span className="italic">snapshot</span></h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Champions', value: totals.champions, sub: `${championPct}% of base`, rev: rupiah(totals.championRevenue), color: SEGMENT_COLORS['Champions'] },
              { label: 'Loyal',     value: totals.loyal,     sub: 'repeat buyers',           rev: '',                              color: SEGMENT_COLORS['Loyal'] },
              { label: 'At Risk',   value: totals.atRisk,    sub: `${atRiskPct}% of base`,   rev: rupiah(totals.atRiskRevenue),    color: SEGMENT_COLORS['At Risk'] },
              { label: 'Lost',      value: totals.lost,      sub: 'need win-back',            rev: '',                             color: SEGMENT_COLORS['Lost'] },
            ].map(card => (
              <div key={card.label} className="p-5" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
                <p style={{ color: DC.textMuted }} className="eyebrow">{card.label}</p>
                <p className="numeral text-[2.5rem] leading-none mt-2" style={{ color: card.color }}>{card.value}</p>
                <p className="text-[0.72rem] mt-1.5" style={{ color: DC.textMuted }}>{card.sub}</p>
                {card.rev && <p className="numeral text-[0.8rem] mt-1" style={{ color: DC.textSecondary }}>{card.rev} revenue</p>}
              </div>
            ))}
          </div>

          {/* Avg stats */}
          <div className="grid grid-cols-3 gap-3 mt-3">
            {[
              { label: 'Avg recency',   value: `${data.avgRecencyDays}d`, sub: 'days since last order' },
              { label: 'Avg frequency', value: `${data.avgFrequency}`,    sub: 'orders per customer' },
              { label: 'Avg spend',     value: rupiah(data.avgMonetary),  sub: 'lifetime per customer' },
            ].map(s => (
              <div key={s.label} className="p-4" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
                <p style={{ color: DC.textMuted }} className="eyebrow">{s.label}</p>
                <p className="numeral text-[1.6rem] mt-1" style={{ color: DC.textPrimary }}>{s.value}</p>
                <p className="text-[0.7rem] mt-0.5" style={{ color: DC.textMuted }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── RFM Score Key ── */}
          <div className="mt-3 p-5" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            <p className="eyebrow mb-4" style={{ color: DC.gold }}>How scores work  ·  1 = weakest  ·  5 = strongest</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  letter: 'R',
                  name: 'Recency',
                  desc: 'Days since their last order',
                  low: 'Bought long ago',
                  high: 'Bought very recently',
                },
                {
                  letter: 'F',
                  name: 'Frequency',
                  desc: 'Total number of orders placed',
                  low: 'Rarely orders',
                  high: 'Orders very often',
                },
                {
                  letter: 'M',
                  name: 'Monetary',
                  desc: 'Lifetime spend across all orders',
                  low: 'Low spender',
                  high: 'Highest spender',
                },
              ].map(dim => (
                <div key={dim.letter} className="flex gap-3">
                  <div
                    className="font-display italic text-[1.6rem] leading-none mt-0.5 w-6 shrink-0"
                    style={{ color: DC.gold }}
                  >
                    {dim.letter}
                  </div>
                  <div>
                    <p className="font-display text-[0.95rem]" style={{ color: DC.textPrimary }}>{dim.name}</p>
                    <p className="text-[0.72rem] mt-0.5" style={{ color: DC.textMuted }}>{dim.desc}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[0.65rem]" style={{ color: DC.textMuted }}>1</span>
                      <ScorePip score={1} />
                      <span className="text-[0.65rem] mx-1" style={{ color: DC.textMuted }}>{dim.low}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[0.65rem]" style={{ color: DC.gold }}>5</span>
                      <ScorePip score={5} />
                      <span className="text-[0.65rem] mx-1" style={{ color: DC.textSecondary }}>{dim.high}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 02 · Bubble Chart (one bubble per segment, size = customer count) ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>02</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Recency vs <span className="italic">Frequency</span></h2>
            <span className="text-[0.7rem] ml-2" style={{ color: DC.textMuted }}>one bubble per segment · bubble size = number of customers</span>
          </div>
          <div className="p-6" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
                <CartesianGrid stroke={DC.divider} strokeDasharray="2 4" />
                <XAxis
                  dataKey="avgR"
                  type="number"
                  name="Avg Recency Score"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: DC.textMuted, fontSize: 11 }}
                  label={{ value: 'Recency Score  (1 = old buyer · 5 = bought recently)', position: 'insideBottom', offset: -16, fill: DC.textMuted, fontSize: 10 }}
                />
                <YAxis
                  dataKey="avgF"
                  type="number"
                  name="Avg Frequency Score"
                  domain={[0, 6]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fill: DC.textMuted, fontSize: 11 }}
                  label={{ value: 'Frequency Score  (1 = rarely · 5 = orders often)', angle: -90, position: 'insideLeft', offset: 18, fill: DC.textMuted, fontSize: 10 }}
                />
                <Tooltip content={<ScatterTooltip />} cursor={false} />
                <Scatter data={segmentBubbles} isAnimationActive={false}>
                  {segmentBubbles.map((seg, i) => (
                    <Cell
                      key={i}
                      fill={seg.color}
                      fillOpacity={0.75}
                      stroke={seg.color}
                      strokeOpacity={0.4}
                      strokeWidth={2}
                      // radius scales with customer count: segment with most customers gets r=44
                      r={Math.max(12, Math.round((seg.count / maxBubbleCount) * 44))}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>

            {/* Legend grid */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-3" style={{ borderTop: `1px solid ${DC.divider}` }}>
              {segmentBubbles
                .slice()
                .sort((a, b) => b.count - a.count)
                .map(seg => (
                  <button
                    key={seg.name}
                    onClick={() => setFilterSeg(filterSeg === seg.name ? 'All' : seg.name)}
                    className="flex items-center gap-2 text-[0.72rem] transition-opacity"
                    style={{ opacity: filterSeg !== 'All' && filterSeg !== seg.name ? 0.3 : 1 }}
                  >
                    {/* Mini bubble sized by count */}
                    <span
                      className="rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: seg.color,
                        opacity: 0.75,
                        width:  Math.max(8,  Math.round((seg.count / maxBubbleCount) * 20)),
                        height: Math.max(8,  Math.round((seg.count / maxBubbleCount) * 20)),
                      }}
                    />
                    <span style={{ color: DC.textSecondary }}>{seg.name}</span>
                    <span className="numeral" style={{ color: DC.textMuted }}>({seg.count})</span>
                  </button>
                ))}
            </div>
          </div>
        </section>

        {/* ── 03 · Segment Distribution ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>03</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">Segment <span className="italic">breakdown</span></h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="p-6 space-y-3" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
              <p className="text-xs font-semibold mb-4" style={{ color: DC.textSecondary }}>Customers per segment</p>
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
        </section>

        {/* ── 04 · R×F Heatmap ── */}
        <section>
          <div className="flex items-baseline gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${DC.divider}` }}>
            <span className="numeral text-[0.7rem] tracking-widest" style={{ color: DC.textMuted }}>04</span>
            <h2 className="font-display text-[1.3rem] tracking-editorial">R × F <span className="italic">heatmap</span></h2>
            <span className="text-[0.7rem] ml-2" style={{ color: DC.textMuted }}>customer density per R/F score combination</span>
          </div>
          <div className="p-6 overflow-x-auto" style={{ backgroundColor: DC.card, border: `1px solid ${DC.border}` }}>
            {(() => {
              const grid: number[][] = Array.from({ length: 5 }, () => new Array(5).fill(0))
              customers.forEach(c => {
                grid[4 - Math.min(4, c.fScore - 1)][Math.min(4, c.rScore - 1)] += 1
              })
              const maxCell = Math.max(1, ...grid.flat())
              return (
                <div className="min-w-[400px]">
                  <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1">
                    <div className="text-center text-[0.65rem] leading-tight" style={{ color: DC.textMuted }}>
                      <div>↑ F score</div>
                      <div>(orders)</div>
                    </div>
                    {[1,2,3,4,5].map(r => (
                      <div key={r} className="text-center numeral text-[0.7rem]" style={{ color: DC.textMuted }}>
                        R = {r}
                        <div className="text-[0.6rem]">
                          {r === 1 ? 'old' : r === 5 ? 'recent' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                  {grid.map((row, rowIdx) => {
                    const fLabel = 5 - rowIdx
                    return (
                      <div key={rowIdx} className="grid grid-cols-[60px_repeat(5,1fr)] gap-1 mb-1">
                        <div className="flex flex-col justify-center text-right pr-2">
                          <span className="numeral text-[0.7rem]" style={{ color: DC.textMuted }}>F = {fLabel}</span>
                          <span className="text-[0.6rem]" style={{ color: DC.textMuted }}>
                            {fLabel === 5 ? 'frequent' : fLabel === 1 ? 'rarely' : ''}
                          </span>
                        </div>
                        {row.map((val, colIdx) => {
                          const intensity = val / maxCell
                          const bg = intensity === 0
                            ? 'rgba(42,15,28,0.4)'
                            : `rgba(184,146,42,${0.1 + intensity * 0.9})`
                          return (
                            <div
                              key={colIdx}
                              className="aspect-square flex items-center justify-center numeral text-[0.75rem] rounded-sm hover:scale-105 transition-transform cursor-default"
                              style={{ backgroundColor: bg, color: intensity > 0.4 ? '#1C0810' : DC.textSecondary }}
                              title={`R=${colIdx + 1}, F=${fLabel}: ${val} customer${val !== 1 ? 's' : ''}`}
                            >
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

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 px-3 text-xs bg-transparent focus:outline-none"
              style={{ border: `1px solid ${DC.border}`, color: DC.textPrimary, minWidth: 200 }}
            />
            <div className="flex flex-wrap gap-2">
              {(['All', ...segments.map(s => s.name)] as (RFMSegment | 'All')[]).map(seg => (
                <button
                  key={seg}
                  onClick={() => setFilterSeg(seg)}
                  className="px-2.5 py-1 text-[0.65rem] transition-all rounded-full"
                  style={{
                    backgroundColor: filterSeg === seg
                      ? (seg === 'All' ? DC.gold : SEGMENT_COLORS[seg as RFMSegment])
                      : 'transparent',
                    color: filterSeg === seg ? '#1C0810' : DC.textMuted,
                    border: `1px solid ${filterSeg === seg
                      ? (seg === 'All' ? DC.gold : SEGMENT_COLORS[seg as RFMSegment])
                      : DC.divider}`,
                  }}
                >
                  {seg}
                </button>
              ))}
            </div>
            <span className="text-[0.7rem] ml-auto numeral" style={{ color: DC.textMuted }}>
              {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto" style={{ border: `1px solid ${DC.border}` }}>
            <table className="w-full text-xs min-w-[860px]">
              <thead>
                <tr style={{ borderBottom: `1px solid ${DC.divider}` }}>
                  {([
                    { key: 'name',        label: 'Customer',       title: '' },
                    { key: 'segment',     label: 'Segment',        title: '' },
                    { key: 'rScore',      label: 'R — Recency',    title: 'Score 1–5. 5 = bought most recently' },
                    { key: 'fScore',      label: 'F — Frequency',  title: 'Score 1–5. 5 = orders most often' },
                    { key: 'mScore',      label: 'M — Spend',      title: 'Score 1–5. 5 = highest lifetime spender' },
                    { key: 'recencyDays', label: 'Last order',     title: 'Days since their most recent order' },
                    { key: 'frequency',   label: 'Orders',         title: 'Total orders placed' },
                    { key: 'monetary',    label: 'Lifetime spend', title: 'Total revenue from this customer' },
                    { key: 'tier',        label: 'Tier',           title: 'Loyalty tier: silver / gold / platinum' },
                  ] as { key: keyof CustomerRFM; label: string; title: string }[]).map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      title={col.title}
                      className="text-left py-3 px-3 font-medium cursor-pointer select-none transition-colors hover:opacity-80 whitespace-nowrap"
                      style={{ color: sortCol === col.key ? DC.gold : DC.textMuted }}
                    >
                      {col.label}
                      {sortCol === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center font-display italic" style={{ color: DC.textMuted }}>
                      No customers match.
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr
                    key={c.userId}
                    style={{ borderBottom: `1px solid ${DC.divider}` }}
                    className="transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                  >
                    <td className="py-3 px-3">
                      <p className="font-display" style={{ color: DC.textPrimary }}>{c.name}</p>
                      <p className="numeral text-[0.65rem] mt-0.5" style={{ color: DC.textMuted }}>{c.email}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: `${SEGMENT_COLORS[c.segment]}22`,
                          color: SEGMENT_COLORS[c.segment],
                          border: `1px solid ${SEGMENT_COLORS[c.segment]}44`,
                        }}
                      >
                        {c.segment}
                      </span>
                    </td>
                    <td className="py-3 px-3"><ScorePip score={c.rScore} /></td>
                    <td className="py-3 px-3"><ScorePip score={c.fScore} /></td>
                    <td className="py-3 px-3"><ScorePip score={c.mScore} /></td>
                    <td className="py-3 px-3 numeral" style={{
                      color: c.recencyDays === 0 ? '#4ECDC4' : c.recencyDays <= 7 ? DC.textPrimary : c.recencyDays <= 30 ? DC.textSecondary : DC.textMuted
                    }}>
                      {c.recencyDays === 0 ? 'Today' : `${c.recencyDays}d ago`}
                    </td>
                    <td className="py-3 px-3 numeral text-center" style={{ color: DC.textSecondary }}>{c.frequency}</td>
                    <td className="py-3 px-3 numeral font-semibold" style={{ color: DC.gold }}>{rupiah(c.monetary)}</td>
                    <td className="py-3 px-3">
                      <span className="text-[0.65rem] capitalize" style={{ color: DC.textMuted }}>{c.tier}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
