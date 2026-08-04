'use client'

import Link from '@/shims/next-link'
import { useMemo } from 'react'
import { useRouter, useSearchParams } from '@/shims/next-navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import ThemeToggle from '@/components/ThemeToggle'
import type {
  CampaignOutcome,
  SegmentBaseline,
  TradeSpendPacing,
} from '@/lib/dashboard/semantic/types'
import { recipeFor } from '@/lib/dashboard/campaigns/playbook'
import type { RFMSegment } from '@/lib/dashboard/real-metrics'
import { getDashColors } from '@/lib/dashboard/theme'
import { useTheme } from '@/lib/dashboard/use-theme'
import { InfoTip, HowToRead } from './InfoTip'

type WindowPreset = '7d' | '30d' | '90d' | '180d' | 'all'
const WINDOW_OPTIONS: { value: WindowPreset; label: string }[] = [
  { value: '7d',   label: '7 days' },
  { value: '30d',  label: '30 days' },
  { value: '90d',  label: '90 days' },
  { value: '180d', label: '180 days' },
  { value: 'all',  label: 'All time' },
]

function windowToSince(w: WindowPreset): Date | null {
  if (w === 'all') return null
  const days = w === '7d' ? 7 : w === '30d' ? 30 : w === '90d' ? 90 : 180
  return new Date(Date.now() - days * 24 * 3600 * 1000)
}

function campaignOverlapsWindow(o: CampaignOutcome, since: Date | null): boolean {
  if (!since) return true
  // "active during window" — either started after `since`, or ended after `since`,
  // or still active (end_at null or future).
  const start = o.start_at ? new Date(o.start_at) : null
  const end = o.end_at ? new Date(o.end_at) : null
  if (start && start >= since) return true
  if (end && end >= since) return true
  if (!end && start && start < since) return true   // still active, started before
  return false
}

type DashColors = ReturnType<typeof getDashColors>

function formatRupiah(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`
  return `${sign}Rp ${Math.round(abs)}`
}

function formatPct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`
}

function mroiColor(mroi: number, hurdle: number, colors: DashColors): string {
  if (mroi >= hurdle) return colors.emerald
  if (mroi >= hurdle * 0.8) return colors.gold
  return colors.red
}

function statusChip(status: string, colors: DashColors): { label: string; color: string } {
  switch (status) {
    case 'draft':     return { label: 'DRAFT',     color: colors.textSecondary }
    case 'active':    return { label: 'ACTIVE',    color: colors.emerald }
    case 'completed': return { label: 'COMPLETED', color: colors.gold }
    case 'archived':  return { label: 'ARCHIVED',  color: colors.textMuted }
    default:          return { label: status.toUpperCase(), color: colors.textSecondary }
  }
}

const ALL_SEGMENTS: RFMSegment[] = [
  'Champions', 'Loyal', 'Potential Loyalists', 'New Customers', 'Promising',
  'Needs Attention', 'At Risk', 'Cannot Lose', 'Hibernating', 'Lost',
]

export default function CampaignsClient({
  outcomes: allOutcomes, baselines, pacing, rfmBySegment, windowPreset,
}: {
  outcomes: CampaignOutcome[]
  baselines: SegmentBaseline[]
  pacing: TradeSpendPacing[]
  rfmBySegment: Record<string, number>
  windowPreset: WindowPreset
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const { theme } = useTheme()
  const colors = getDashColors(theme)

  const baselineBySegment = useMemo(() => {
    const m = new Map<string, SegmentBaseline>()
    for (const b of baselines) m.set(b.segment_key, b)
    return m
  }, [baselines])

  // ── Filter outcomes by window ──────────────────────────────
  const since = windowToSince(windowPreset)
  const outcomes = useMemo(
    () => allOutcomes.filter((o) => campaignOverlapsWindow(o, since)),
    [allOutcomes, since],
  )

  const onWindowChange = (w: WindowPreset) => {
    const params = new URLSearchParams(sp.toString())
    if (w === '90d') params.delete('w')
    else params.set('w', w)
    router.push(`/analytics/campaigns${params.toString() ? '?' + params.toString() : ''}`)
  }

  // ── Exec KPIs ───────────────────────────────────────────────
  const activeCampaigns = outcomes.filter((o) => o.status === 'active').length
  const completedCampaigns = outcomes.filter((o) => o.status === 'completed')

  const thisMonth = new Date().toISOString().slice(0, 7)
  const mtdPacing = pacing.filter((p) => p.month.startsWith(thisMonth))
  const mtdBudget = mtdPacing.reduce((s, p) => s + Number(p.budget_amount), 0)
  const mtdSpend = mtdPacing.reduce((s, p) => s + Number(p.mtd_spend), 0)
  const mtdPacePct = mtdBudget > 0 ? mtdSpend / mtdBudget : 0

  const mtdIncrementalRevenue = outcomes
    .filter((o) => o.status === 'active' || (o.status === 'completed' && o.end_at && o.end_at.startsWith(thisMonth.slice(0, 7))))
    .reduce((s, o) => s + Number(o.incremental_revenue), 0)

  const sumCm = completedCampaigns.reduce((s, o) => s + Number(o.incremental_cm), 0)
  const sumSpend = completedCampaigns.reduce((s, o) => s + Number(o.actual_trade_spend), 0)
  const blendedMroi = sumSpend > 0 ? sumCm / sumSpend : 0

  const totalLiability = outcomes.reduce((s, o) => s + Number(o.redemption_liability), 0)

  const avgCanniOutcomes = completedCampaigns.filter((o) => Number(o.cannibalization_ratio) > 0)
  const avgCanni = avgCanniOutcomes.length > 0
    ? avgCanniOutcomes.reduce((s, o) => s + Number(o.cannibalization_ratio), 0) / avgCanniOutcomes.length
    : 0

  // ── Segment health grid data ───────────────────────────────
  const segmentHealth = ALL_SEGMENTS.map((seg) => {
    const count = rfmBySegment[seg] ?? 0
    const baseline = baselineBySegment.get(seg)
    const segOutcomes = completedCampaigns.filter((o) => o.segment_key === seg)
    const avgMroi = segOutcomes.length > 0
      ? segOutcomes.reduce((s, o) => s + Number(o.mroi), 0) / segOutcomes.length
      : 0
    const recipe = recipeFor(seg)
    return {
      segment: seg,
      count,
      aov: baseline?.avg_order_value ?? 0,
      redemptionRate: baseline?.base_redemption_rate ?? 0,
      avgMroi,
      recipeIntent: recipe.intent,
      maxDiscount: recipe.max_discount_pct,
    }
  })

  // ── Pacing chart data ───────────────────────────────────────
  const pacingChart = mtdPacing
    .sort((a, b) => Number(b.budget_amount) - Number(a.budget_amount))
    .map((p) => ({
      segment: p.segment_key.length > 10 ? p.segment_key.slice(0, 10) + '…' : p.segment_key,
      Budget: Number(p.budget_amount),
      Spend: Number(p.mtd_spend),
    }))

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-dash-card-border" style={{ backgroundColor: colors.headerBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="eyebrow text-hd-gold">HD Analytics</span>
            <h1 className="font-display text-[1.6rem] tracking-editorial text-dash-text leading-tight mt-0.5">
              Promotional investment, <span className="italic">live.</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/analytics/campaigns/new"
              className="self-start sm:self-auto px-4 py-2 bg-hd-gold text-[#1C0810] text-xs font-semibold tracking-wider uppercase hover:bg-hd-gold-light transition-colors"
            >
              + New Campaign
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <AnalyticsTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* How to read this page */}
        <HowToRead title="How to read this page">
          <ol className="list-decimal list-inside space-y-2 text-[13px]">
            <li>
              <strong>Pick a time frame</strong> below (default: last 90 days). All the campaign list and rollup
              metrics filter to campaigns active in that window.
            </li>
            <li>
              The <strong>Exec command center</strong> shows the six numbers a COO would ask for in 30 seconds:
              how many active campaigns, how much we&apos;ve spent on promos this month vs budget, how much revenue
              was actually <em>incremental</em> (not would-have-happened-anyway), blended mROI across completed
              campaigns, outstanding voucher liability, and average cannibalization.
            </li>
            <li>
              Hover the <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-semibold rounded-full"
                style={{ border: '1px solid rgba(184,146,42,0.35)', color: 'var(--dash-text-muted)' }}>?</span>
              next to any term for a plain-language explanation.
            </li>
            <li>
              The <strong>Campaigns table</strong> shows every campaign in your window. Click a name to drill in —
              that&apos;s where the real story lives (treatment vs holdout, lessons learned, etc.).
            </li>
            <li>
              The <strong>Segment health grid</strong> at the bottom is your commercial playbook: for each RFM
              segment it shows the current customer count, baseline order value, the max discount the segment&apos;s
              economics can sustain, and (if we&apos;ve run campaigns there before) historical mROI.
            </li>
            <li>
              Click <strong>+ New Campaign</strong> to go to the simulator — picks a segment, pre-loads the
              recommended offer, and lets you project the economics before issuing.
            </li>
          </ol>
        </HowToRead>

        {/* Window picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="eyebrow" style={{ color: colors.textSecondary }}>Showing campaigns active in:</span>
          {WINDOW_OPTIONS.map((opt) => {
            const active = opt.value === windowPreset
            return (
              <button
                key={opt.value}
                onClick={() => onWindowChange(opt.value)}
                className="text-[11px] tracking-wider uppercase px-3 py-1.5 transition-colors"
                style={{
                  color: active ? colors.bg : colors.textPrimary,
                  backgroundColor: active ? colors.gold : 'transparent',
                  border: `1px solid ${active ? colors.gold : colors.cardBorder}`,
                }}
              >
                {opt.label}
              </button>
            )
          })}
          <span className="text-[11px] ml-auto" style={{ color: colors.textMuted }}>
            {outcomes.length} of {allOutcomes.length} campaigns in view
          </span>
        </div>

        {/* Exec KPI strip */}
        <section>
          <h2 className="eyebrow mb-3" style={{ color: colors.textSecondary }}>Exec command center</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI label="Active campaigns" value={activeCampaigns.toString()} />
            <KPI
              label="MTD trade spend"
              tip="trade_spend"
              value={formatRupiah(mtdSpend)}
              sub={`${formatPct(mtdPacePct, 0)} of ${formatRupiah(mtdBudget)}`}
              subColor={mtdPacePct > 0.9 ? colors.red : mtdPacePct > 0.6 ? colors.gold : colors.emerald}
            />
            <KPI label="Incremental revenue" tip="incremental_revenue" value={formatRupiah(mtdIncrementalRevenue)} />
            <KPI
              label="Blended mROI"
              tip="mroi"
              value={`${blendedMroi.toFixed(2)}×`}
              subColor={blendedMroi >= 1.5 ? colors.emerald : blendedMroi >= 1.0 ? colors.gold : colors.red}
            />
            <KPI label="Redemption liability" tip="redemption_liability" value={formatRupiah(totalLiability)} />
            <KPI
              label="Avg cannibalization"
              tip="cannibalization"
              value={formatPct(avgCanni)}
              subColor={avgCanni > 0.6 ? colors.red : avgCanni > 0.4 ? colors.gold : colors.emerald}
            />
          </div>
        </section>

        {/* Trade spend pacing */}
        {pacingChart.length > 0 && (
          <section style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }} className="p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display text-[1.1rem] text-dash-text">Trade-spend pacing — this month</h3>
              <span className="text-xs" style={{ color: colors.textSecondary }}>budget vs MTD spend per segment</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pacingChart} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.divider} />
                <XAxis dataKey="segment" tick={{ fill: colors.textSecondary, fontSize: 10 }} />
                <YAxis tick={{ fill: colors.textSecondary, fontSize: 10 }} tickFormatter={formatRupiah} />
                <Tooltip contentStyle={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}`, color: colors.textPrimary }} formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="Budget" fill={colors.gold} fillOpacity={0.25} />
                <Bar dataKey="Spend" fill={colors.gold} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Campaign list */}
        <section style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }} className="p-5">
          <h3 className="font-display text-[1.1rem] text-dash-text mb-3">Campaigns</h3>
          {outcomes.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: colors.textSecondary }}>
              No campaigns yet. <Link href="/analytics/campaigns/new" className="text-hd-gold underline">Design the first one</Link>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.cardBorder}` }}>
                    <Th>Name</Th>
                    <Th tip="segment">Segment</Th>
                    <Th>Status</Th>
                    <Th align="right">Issued</Th>
                    <Th align="right" tip="redemption_rate">Redeemed</Th>
                    <Th align="right" tip="redemption_rate">Redemption</Th>
                    <Th align="right" tip="trade_spend">Trade spend</Th>
                    <Th align="right" tip="incremental_cm">Incremental CM</Th>
                    <Th align="right" tip="mroi">mROI</Th>
                    <Th align="right" tip="cannibalization">Canni</Th>
                  </tr>
                </thead>
                <tbody>
                  {outcomes.map((o) => {
                    const sc = statusChip(o.status, colors)
                    const mroi = Number(o.mroi)
                    const canni = Number(o.cannibalization_ratio)
                    return (
                      <tr key={o.campaign_id} className="hover:bg-[rgba(184,146,42,0.05)] transition-colors" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                        <Td>
                          <Link href={`/analytics/campaigns/${o.campaign_id}`} className="text-dash-text hover:text-hd-gold transition-colors">
                            {o.name}
                          </Link>
                        </Td>
                        <Td><span className="text-[11px] px-2 py-0.5 rounded" style={{ color: colors.gold, backgroundColor: 'rgba(184,146,42,0.1)' }}>{o.segment_key}</span></Td>
                        <Td><span className="text-[10px] font-semibold tracking-wider" style={{ color: sc.color }}>{sc.label}</span></Td>
                        <Td align="right">{o.issued}</Td>
                        <Td align="right">{o.redeemed}</Td>
                        <Td align="right">{formatPct(Number(o.redemption_rate))}</Td>
                        <Td align="right">{formatRupiah(Number(o.actual_trade_spend))}</Td>
                        <Td align="right">{formatRupiah(Number(o.incremental_cm))}</Td>
                        <Td align="right">
                          <span className="font-semibold" style={{ color: mroiColor(mroi, Number(o.mroi_hurdle), colors) }}>
                            {mroi.toFixed(2)}×
                          </span>
                        </Td>
                        <Td align="right">
                          <span style={{ color: canni > 0.6 ? colors.red : canni > 0.4 ? colors.gold : colors.textSecondary }}>
                            {formatPct(canni, 0)}
                          </span>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Segment health grid */}
        <section style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }} className="p-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-display text-[1.1rem] text-dash-text">Segment health & recommended plays</h3>
            <span className="text-xs" style={{ color: colors.textSecondary }}>from per-segment playbook</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {segmentHealth.map((s) => (
              <div key={s.segment} className="p-3" style={{ border: `1px solid ${colors.cardBorder}`, backgroundColor: colors.cardHover }}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: colors.gold }}>
                    {s.segment}
                  </span>
                  <span className="numeral text-[0.9rem] text-dash-text">{s.count}</span>
                </div>
                <p className="text-[11px] mb-2 leading-snug" style={{ color: colors.textSecondary }}>
                  {s.recipeIntent}
                </p>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: colors.textMuted }}>
                  <span>AOV {formatRupiah(s.aov)}</span>
                  <span>Max {s.maxDiscount}%</span>
                  {s.avgMroi > 0 && (
                    <span style={{ color: mroiColor(s.avgMroi, 1.5, colors) }}>hist {s.avgMroi.toFixed(1)}×</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}

function KPI({ label, value, sub, subColor, tip }: {
  label: string; value: string; sub?: string; subColor?: string;
  tip?: keyof typeof import('./glossary').GLOSSARY
}) {
  const { theme } = useTheme()
  const colors = getDashColors(theme)
  return (
    <div className="p-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.cardBorder}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <p className="eyebrow" style={{ color: colors.textSecondary }}>{label}</p>
        {tip && <InfoTip term={tip} />}
      </div>
      <p className="numeral text-[1.4rem] text-dash-text leading-none">{value}</p>
      {sub && (
        <p className="text-[10px] mt-1.5" style={{ color: subColor ?? colors.textSecondary }}>{sub}</p>
      )}
    </div>
  )
}

function Th({ children, align, tip }: {
  children: React.ReactNode; align?: 'right' | 'left';
  tip?: keyof typeof import('./glossary').GLOSSARY
}) {
  const { theme } = useTheme()
  const colors = getDashColors(theme)
  return (
    <th className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: colors.textMuted }}>
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {children}{tip && <InfoTip term={tip} />}
      </span>
    </th>
  )
}
function Td({ children, align }: { children: React.ReactNode; align?: 'right' | 'left' }) {
  const { theme } = useTheme()
  const colors = getDashColors(theme)
  return (
    <td className={`px-2 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: colors.textPrimary }}>
      {children}
    </td>
  )
}
