'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import type {
  Campaign,
  CampaignOutcome,
  CampaignTarget,
  Incrementality,
} from '@/lib/dashboard/semantic/types'
import { completeAction, issueAction } from '../actions'
import { InfoTip, HowToRead } from '../InfoTip'

const COLORS = {
  bg: '#1C0810', card: '#2A0F1C', cardBorder: 'rgba(184, 146, 42, 0.18)',
  burgundy: '#650A30', gold: '#B8922A', goldLight: '#F5E6C8',
  emerald: '#4ECDC4', red: '#D96C6C',
  textPrimary: '#FEF2E3',
  textSecondary: 'rgba(254, 242, 227, 0.55)',
  textMuted: 'rgba(254, 242, 227, 0.35)',
  gridLine: 'rgba(254, 242, 227, 0.08)',
}

function formatRupiah(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`
  return `${sign}Rp ${Math.round(abs)}`
}
function formatPct(n: number, d = 1): string { return `${(n * 100).toFixed(d)}%` }

function lessons(
  campaign: Campaign,
  outcome: CampaignOutcome | null,
  inc: Incrementality | null,
): string[] {
  const out: string[] = []
  if (!outcome || !inc) return ['Too early — wait for redemptions to accumulate.']
  const canni = Number(inc.cannibalization_ratio)
  const mroi = Number(inc.mroi)
  const projMroi = Number(outcome.projected_mroi)
  const redRate = Number(outcome.redemption_rate)

  if (canni > 0.6) {
    out.push(`Cannibalization at ${formatPct(canni)} — this campaign largely discounted purchases that would have happened anyway. Next time narrow the segment or raise the min_order threshold.`)
  } else if (canni > 0 && canni < 0.3) {
    out.push(`Low cannibalization (${formatPct(canni)}) — most revenue is genuinely incremental. Scale this playbook to adjacent segments.`)
  }

  if (projMroi > 0) {
    const delta = mroi - projMroi
    if (Math.abs(delta) > 0.5) {
      out.push(
        delta > 0
          ? `mROI outperformed projection by ${delta.toFixed(2)}× — redemption was higher than expected. Review lift_factor assumption before next campaign.`
          : `mROI underperformed projection by ${Math.abs(delta).toFixed(2)}× — either redemption missed or discount depth was higher than the economics supported.`,
      )
    }
  }

  if (redRate > 0 && redRate < 0.05) {
    out.push(`Redemption rate ${formatPct(redRate)} is very low — the offer may have been too weak or the targeting mismatched. Consider personalization or higher perceived value.`)
  }

  if (campaign.justification && campaign.justification.length > 0) {
    out.push(`Gate override logged at issuance: "${campaign.justification}"`)
  }
  if (out.length === 0) out.push('Performance landed within expected range — no flags.')
  return out
}

export default function CampaignDetailClient({
  campaign, outcome, incrementality, targets,
}: {
  campaign: Campaign
  outcome: CampaignOutcome | null
  incrementality: Incrementality | null
  targets: CampaignTarget[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'redeemed' | 'not_redeemed' | 'holdout'>('all')

  const mroi = incrementality ? Number(incrementality.mroi) : 0
  const canni = incrementality ? Number(incrementality.cannibalization_ratio) : 0
  const redRate = outcome ? Number(outcome.redemption_rate) : 0
  const incRevenue = incrementality ? Number(incrementality.incremental_revenue) : 0
  const tradeSpend = outcome ? Number(outcome.actual_trade_spend) : 0
  const actualCm = outcome ? Number(outcome.actual_cm) : 0
  const incCm = incrementality ? Number(incrementality.incremental_cm) : 0

  const compareData = outcome ? [
    { metric: 'Revenue',     Projected: Number(outcome.projected_revenue),     Actual: Number(outcome.actual_revenue) },
    { metric: 'Trade spend', Projected: Number(outcome.projected_trade_spend), Actual: tradeSpend },
    { metric: 'CM',          Projected: Number(outcome.projected_cm),          Actual: actualCm },
    { metric: 'Incremental CM', Projected: Number(outcome.projected_cm),       Actual: incCm },
  ] : []

  const groupCompareData = incrementality ? [
    {
      group: 'Treatment',
      OrderRate: Number(incrementality.treatment_order_rate),
      Size: Number(incrementality.treatment_size),
    },
    {
      group: 'Holdout',
      OrderRate: Number(incrementality.holdout_order_rate),
      Size: Number(incrementality.holdout_size),
    },
  ] : []

  const onIssue = () => {
    startTransition(async () => {
      setStatus('issuing…')
      const res = await issueAction(campaign.id)
      setStatus(res.ok ? `issued — treatment ${res.treatmentSize}, holdout ${res.holdoutSize}` : `error: ${res.error ?? 'unknown'}`)
      if (res.ok) router.refresh()
    })
  }
  const onComplete = () => {
    startTransition(async () => {
      setStatus('completing…')
      const res = await completeAction(campaign.id)
      setStatus(res.ok ? 'completed' : `error: ${res.error ?? 'unknown'}`)
      if (res.ok) router.refresh()
    })
  }

  const filteredTargets = targets.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'holdout') return t.is_holdout
    if (filter === 'redeemed') return !t.is_holdout && t.voucher_id != null   // heuristic — true redemption detection needs join on orders
    if (filter === 'not_redeemed') return !t.is_holdout
    return true
  })

  const lessonsList = lessons(campaign, outcome, incrementality)

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#3d1825]" style={{ backgroundColor: 'rgba(15,15,18,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
          <div>
            <span className="eyebrow text-[#B8922A]">Campaign · {campaign.segment_key}</span>
            <h1 className="font-display text-[1.4rem] tracking-editorial text-[#FEF2E3] leading-tight mt-0.5">
              {campaign.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1"
                  style={{
                    color: campaign.status === 'active' ? COLORS.emerald : campaign.status === 'completed' ? COLORS.gold : COLORS.textSecondary,
                    border: `1px solid ${COLORS.cardBorder}`,
                  }}>
              {campaign.status}
            </span>
            <Link href="/analytics/campaigns" className="text-xs tracking-wider uppercase" style={{ color: COLORS.textSecondary }}>
              ← back
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <AnalyticsTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <HowToRead title="How to read this campaign">
          <ol className="list-decimal list-inside space-y-2 text-[13px]">
            <li>
              The <strong>header KPIs</strong> are the four numbers that matter: incremental mROI, incremental
              revenue, redemption rate, cannibalization. Click the <span className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] font-semibold rounded-full"
                style={{ border: '1px solid rgba(184,146,42,0.35)', color: 'rgba(254,242,227,0.55)' }}>?</span>
              next to each for a definition.
            </li>
            <li>
              The <strong>Treatment vs Holdout</strong> chart is the honest view: our targeted customers&apos; order rate
              minus the random-holdout group&apos;s order rate = true causal lift. If they&apos;re the same, the campaign
              didn&apos;t cause anything.
            </li>
            <li>
              <strong>Projected vs Actual</strong> tells you how well we sized the opportunity at design time.
              Big gaps = our baselines or lift-factor assumptions need tuning before the next campaign.
            </li>
            <li>
              <strong>Lessons learned</strong> is auto-generated from the numbers above — read it first if you&apos;re
              in a hurry.
            </li>
          </ol>
        </HowToRead>

        {/* Campaign window */}
        <div className="flex items-center gap-4 flex-wrap text-xs" style={{ color: COLORS.textSecondary }}>
          <span className="eyebrow">Campaign window</span>
          <span style={{ color: COLORS.textPrimary }}>
            {campaign.start_at ? new Date(campaign.start_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            {'  →  '}
            {campaign.end_at ? new Date(campaign.end_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'open-ended'}
          </span>
          {campaign.start_at && campaign.end_at && (
            <span style={{ color: COLORS.textMuted }}>
              ({Math.max(1, Math.round((new Date(campaign.end_at).getTime() - new Date(campaign.start_at).getTime()) / (24 * 3600 * 1000)))} days)
            </span>
          )}
          <span style={{ color: COLORS.textMuted }}>·</span>
          <span style={{ color: COLORS.textSecondary }}>
            Scope: {campaign.product_scope.replace('_', ' ')}
          </span>
          <span style={{ color: COLORS.textMuted }}>·</span>
          <span style={{ color: COLORS.textSecondary }}>
            Offer: {campaign.offer_type.replace('_', ' ')} {campaign.offer_value}
            {campaign.offer_type.includes('fixed') ? ' IDR' : '%'}
          </span>
        </div>

        {/* KPI header */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI label="mROI (incremental)" tip="mroi" value={`${mroi.toFixed(2)}×`}
               sub={`hurdle ${campaign.mroi_hurdle}× · projected ${Number(outcome?.projected_mroi ?? 0).toFixed(2)}×`}
               tone={mroi >= campaign.mroi_hurdle ? 'good' : mroi >= 1.0 ? 'neutral' : 'bad'} />
          <KPI label="Incremental revenue" tip="incremental_revenue" value={formatRupiah(incRevenue)}
               sub={`gross ${formatRupiah(Number(outcome?.actual_revenue ?? 0))}`} />
          <KPI label="Redemption" tip="redemption_rate" value={formatPct(redRate)}
               sub={`${outcome?.redeemed ?? 0} of ${outcome?.issued ?? 0}`} />
          <KPI label="Cannibalization" tip="cannibalization" value={formatPct(canni)}
               tone={canni > 0.6 ? 'bad' : canni > 0.4 ? 'neutral' : 'good'}
               sub={canni > 0.6 ? 'high — most sales would have happened anyway' : ''} />
        </section>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {campaign.status === 'draft' && (
            <button onClick={onIssue} disabled={isPending}
                    className="px-4 py-2 text-xs tracking-wider uppercase font-semibold"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}>
              {isPending ? 'Issuing…' : 'Issue campaign'}
            </button>
          )}
          {campaign.status === 'active' && (
            <button onClick={onComplete} disabled={isPending}
                    className="px-4 py-2 text-xs tracking-wider uppercase font-semibold border"
                    style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}>
              {isPending ? 'Completing…' : 'Mark completed'}
            </button>
          )}
          {status && (
            <span className="text-[11px]" style={{ color: status.startsWith('error') ? COLORS.red : COLORS.emerald }}>{status}</span>
          )}
        </div>

        {/* Incrementality chart */}
        {incrementality && (
          <section style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }} className="p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="font-display text-[1.1rem] text-[#FEF2E3]">Treatment vs holdout</h3>
              <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                the only honest ROI view — orders per user in each group
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={groupCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                  <XAxis dataKey="group" tick={{ fill: COLORS.textSecondary, fontSize: 11 }} />
                  <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textPrimary }} />
                  <Bar dataKey="OrderRate" fill={COLORS.gold}>
                    {groupCompareData.map((e, i) => (
                      <Cell key={i} fill={e.group === 'Treatment' ? COLORS.gold : COLORS.burgundy} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-sm space-y-2">
                <KV k="Treatment size" v={incrementality.treatment_size.toString()} />
                <KV k="Holdout size" v={incrementality.holdout_size.toString()} />
                <KV k="Treatment order rate" v={formatPct(Number(incrementality.treatment_order_rate))} />
                <KV k="Holdout order rate" v={formatPct(Number(incrementality.holdout_order_rate))} />
                <div style={{ borderTop: `1px solid ${COLORS.cardBorder}` }} className="my-2" />
                <KV k="Incremental orders" v={Number(incrementality.incremental_orders).toFixed(1)} />
                <KV k="Incremental revenue" v={formatRupiah(incRevenue)} />
                <KV k="Incremental CM" v={formatRupiah(incCm)} tone={incCm >= 0 ? 'good' : 'bad'} />
                <KV k="Trade spend" v={formatRupiah(tradeSpend)} />
                <KV k="mROI" v={`${mroi.toFixed(2)}×`} tone={mroi >= campaign.mroi_hurdle ? 'good' : 'bad'} />
              </div>
            </div>
          </section>
        )}

        {/* Projected vs actual */}
        {compareData.length > 0 && (
          <section style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }} className="p-5">
            <h3 className="font-display text-[1.1rem] text-[#FEF2E3] mb-4">Projected vs actual</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gridLine} />
                <XAxis dataKey="metric" tick={{ fill: COLORS.textSecondary, fontSize: 11 }} />
                <YAxis tick={{ fill: COLORS.textSecondary, fontSize: 10 }} tickFormatter={formatRupiah} />
                <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, color: COLORS.textPrimary }} formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="Projected" fill={COLORS.burgundy} />
                <Bar dataKey="Actual" fill={COLORS.gold} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Lessons */}
        <section style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }} className="p-5">
          <h3 className="font-display text-[1.1rem] text-[#FEF2E3] mb-3">Lessons learned</h3>
          <ul className="space-y-2 text-sm">
            {lessonsList.map((l, i) => (
              <li key={i} className="flex gap-2" style={{ color: COLORS.textPrimary }}>
                <span style={{ color: COLORS.gold }}>→</span><span>{l}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Target list */}
        <section style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }} className="p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="font-display text-[1.1rem] text-[#FEF2E3]">Targets</h3>
            <div className="flex items-center gap-2">
              {(['all', 'redeemed', 'not_redeemed', 'holdout'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                        className="text-[10px] tracking-wider uppercase px-2 py-1 transition-colors"
                        style={{
                          color: filter === f ? COLORS.gold : COLORS.textSecondary,
                          border: `1px solid ${filter === f ? COLORS.gold : COLORS.cardBorder}`,
                        }}>
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ backgroundColor: COLORS.card }}>
                <tr style={{ borderBottom: `1px solid ${COLORS.cardBorder}` }}>
                  <th className="text-left px-2 py-2 text-[10px] uppercase" style={{ color: COLORS.textMuted }}>User</th>
                  <th className="text-left px-2 py-2 text-[10px] uppercase" style={{ color: COLORS.textMuted }}>Group</th>
                  <th className="text-left px-2 py-2 text-[10px] uppercase" style={{ color: COLORS.textMuted }}>Voucher</th>
                  <th className="text-left px-2 py-2 text-[10px] uppercase" style={{ color: COLORS.textMuted }}>Top pair</th>
                </tr>
              </thead>
              <tbody>
                {filteredTargets.map((t) => (
                  <tr key={`${t.campaign_id}-${t.user_id}`} style={{ borderBottom: `1px solid ${COLORS.gridLine}` }}>
                    <td className="px-2 py-1.5 font-mono" style={{ color: COLORS.textPrimary }}>{t.user_id.slice(0, 8)}…</td>
                    <td className="px-2 py-1.5" style={{ color: t.is_holdout ? COLORS.red : COLORS.emerald }}>
                      {t.is_holdout ? 'Holdout' : 'Treatment'}
                    </td>
                    <td className="px-2 py-1.5 font-mono" style={{ color: COLORS.textSecondary }}>
                      {t.voucher_id ? t.voucher_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-2 py-1.5 font-mono" style={{ color: COLORS.textMuted }}>
                      {t.top_pair_a && t.top_pair_b
                        ? `${t.top_pair_a.slice(0, 6)}↔${t.top_pair_b.slice(0, 6)}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTargets.length === 0 && (
              <p className="text-center py-6 text-xs" style={{ color: COLORS.textSecondary }}>No targets match filter.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function KPI({ label, value, sub, tone, tip }: {
  label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'neutral';
  tip?: keyof typeof import('../glossary').GLOSSARY
}) {
  const color = tone === 'good' ? COLORS.emerald : tone === 'bad' ? COLORS.red : COLORS.textPrimary
  return (
    <div className="p-4" style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.cardBorder}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <p className="eyebrow" style={{ color: '#b8a89a' }}>{label}</p>
        {tip && <InfoTip term={tip} />}
      </div>
      <p className="numeral text-[1.5rem] leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] mt-1.5" style={{ color: COLORS.textSecondary }}>{sub}</p>}
    </div>
  )
}

function KV({ k, v, tone }: { k: string; v: string; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? COLORS.emerald : tone === 'bad' ? COLORS.red : COLORS.textPrimary
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[11px]" style={{ color: COLORS.textSecondary }}>{k}</span>
      <span className="numeral" style={{ color }}>{v}</span>
    </div>
  )
}
