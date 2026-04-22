'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AnalyticsTabs from '@/components/AnalyticsTabs'
import type {
  SegmentBaseline,
  MenuItemMargin,
  TradeSpendPacing,
  OfferType,
  ProductScope,
} from '@/lib/dashboard/semantic/types'
import {
  projectCampaign,
  evaluateGates,
  freezeProjection,
  type ProjectionInput,
} from '@/lib/dashboard/campaigns/projection'
import { recipeFor, type OfferRecipe } from '@/lib/dashboard/campaigns/playbook'
import type { RFMSegment } from '@/lib/dashboard/real-metrics'
import { saveDraftAction, issueAction } from '../actions'
import { InfoTip, HowToRead } from '../InfoTip'

const COLORS = {
  bg: '#1C0810', card: '#2A0F1C', cardBorder: 'rgba(184, 146, 42, 0.18)',
  burgundy: '#650A30', gold: '#B8922A', goldLight: '#F5E6C8',
  emerald: '#4ECDC4', red: '#D96C6C',
  textPrimary: '#FEF2E3',
  textSecondary: 'rgba(254, 242, 227, 0.55)',
  textMuted: 'rgba(254, 242, 227, 0.35)',
}

const ALL_SEGMENTS: RFMSegment[] = [
  'Champions', 'Loyal', 'Potential Loyalists', 'New Customers', 'Promising',
  'Needs Attention', 'At Risk', 'Cannot Lose', 'Hibernating', 'Lost',
]

const OFFER_TYPES: { value: OfferType; label: string }[] = [
  { value: 'percent',        label: 'Percentage discount' },
  { value: 'fixed',          label: 'Fixed amount off' },
  { value: 'bundle_percent', label: 'Bundle %' },
  { value: 'bundle_fixed',   label: 'Bundle fixed' },
  { value: 'tier_unlock',    label: 'Tier unlock' },
  { value: 'bogo',           label: 'BOGO' },
]

const SCOPES: { value: ProductScope; label: string; hint: string }[] = [
  { value: 'all',               label: 'All menu',            hint: 'Applies to any order' },
  { value: 'items',             label: 'Selected items',      hint: 'Picked SKUs only' },
  { value: 'category',          label: 'Category',            hint: 'Any item in picked category' },
  { value: 'personalized_pair', label: 'Personalized bundle', hint: 'Each customer gets THEIR top co-purchase pair' },
]

function formatRupiah(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp ${(abs / 1_000_000_000).toFixed(1)}M`
  if (abs >= 1_000_000) return `${sign}Rp ${(abs / 1_000_000).toFixed(1)}jt`
  if (abs >= 1_000) return `${sign}Rp ${(abs / 1_000).toFixed(0)}rb`
  return `${sign}Rp ${Math.round(abs)}`
}

function formatPct(n: number, d = 1): string { return `${(n * 100).toFixed(d)}%` }

export default function SimulatorClient({
  segmentCounts, baselines, margins, pacing,
}: {
  segmentCounts: Record<string, number>
  baselines: SegmentBaseline[]
  margins: MenuItemMargin[]
  pacing: TradeSpendPacing[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string>('')

  // Segment picker default
  const firstWithCustomers = (ALL_SEGMENTS.find((s) => (segmentCounts[s] ?? 0) > 0) ?? 'At Risk') as RFMSegment
  const [segment, setSegment] = useState<RFMSegment>(firstWithCustomers)
  const recipe: OfferRecipe = recipeFor(segment)

  // Offer state — initialized from playbook
  const [name, setName] = useState<string>(`${segment} — ${recipe.intent}`)
  const [offerType, setOfferType] = useState<OfferType>(recipe.offer_type)
  const [offerValue, setOfferValue] = useState<number>(recipe.offer_value)
  const [minOrder, setMinOrder] = useState<number>(recipe.min_order)
  const [productScope, setProductScope] = useState<ProductScope>(recipe.product_scope)
  const [holdoutPct, setHoldoutPct] = useState<number>(0.10)
  const [mroiHurdle, setMroiHurdle] = useState<number>(1.5)
  const [cmFloor, setCmFloor] = useState<number>(5000)
  const [liftFactor, setLiftFactor] = useState<number>(1.0)
  const [justification, setJustification] = useState<string>('')
  const [startAt, setStartAt] = useState<string>(new Date().toISOString().slice(0, 10))
  const [endAt, setEndAt] = useState<string>(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10))

  // Snap recipe when segment changes (user can still edit)
  const onSegmentChange = (next: RFMSegment) => {
    setSegment(next)
    const r = recipeFor(next)
    setName(`${next} — ${r.intent}`)
    setOfferType(r.offer_type)
    setOfferValue(r.offer_value)
    setMinOrder(r.min_order)
    setProductScope(r.product_scope)
  }

  const baseline = useMemo<SegmentBaseline>(() => {
    return baselines.find((b) => b.segment_key === segment) ?? {
      segment_key: segment,
      customer_count: segmentCounts[segment] ?? 0,
      avg_order_value: 120000,
      total_revenue: 0,
      vouchers_issued: 0,
      vouchers_redeemed: 0,
      base_redemption_rate: 0.15,
      cm_pct: 0.55,
      base_order_rate_90d: 1.5,
    }
  }, [baselines, segment, segmentCounts])

  const weightedGmPct = useMemo(() => {
    if (margins.length === 0) return undefined
    const sum = margins.reduce((s, m) => s + Number(m.gm_pct), 0)
    return sum / margins.length
  }, [margins])

  const segmentCustomerCount = segmentCounts[segment] ?? baseline.customer_count

  const projectionInput: ProjectionInput = {
    segmentCustomerCount,
    segment: baseline,
    offerType, offerValue, minOrder,
    maxDiscount: null,
    productScope,
    holdoutPct,
    liftFactor,
    weightedGmPct,
  }

  const projection = projectCampaign(projectionInput, mroiHurdle)

  // Remaining budget for current month + segment
  const thisMonth = new Date().toISOString().slice(0, 7)
  const budgetRow = pacing.find((p) => p.month.startsWith(thisMonth) && p.segment_key === segment)
  const remainingBudget = budgetRow ? Number(budgetRow.remaining_budget) : null

  const gates = evaluateGates(projection, mroiHurdle, cmFloor, remainingBudget)

  const breakEvenValue = projection.breakEvenValue

  const onSaveDraft = () => {
    if (!gates.all_pass && !justification) {
      setStatus('error: justification required when a gate fails')
      return
    }
    startTransition(async () => {
      setStatus('saving…')
      const res = await saveDraftAction({
        name,
        segment_key: segment,
        offer_type: offerType,
        offer_value: offerValue,
        min_order: minOrder,
        max_discount: null,
        product_scope: productScope,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        holdout_pct: holdoutPct,
        mroi_hurdle: mroiHurdle,
        cm_floor: cmFloor,
        lift_factor: liftFactor,
        justification: justification || undefined,
        projection: freezeProjection(projection) as unknown as Record<string, unknown>,
        trade_spend_budget: projection.expectedTradeSpend,
      })
      if (res.ok && res.id) {
        setStatus('saved — redirecting')
        router.push(`/analytics/campaigns/${res.id}`)
      } else {
        setStatus(`error: ${res.error ?? 'unknown'}`)
      }
    })
  }

  const onIssue = () => {
    if (!gates.all_pass && !justification) {
      setStatus('error: justification required when a gate fails')
      return
    }
    startTransition(async () => {
      setStatus('saving + issuing…')
      const draft = await saveDraftAction({
        name,
        segment_key: segment,
        offer_type: offerType,
        offer_value: offerValue,
        min_order: minOrder,
        max_discount: null,
        product_scope: productScope,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        holdout_pct: holdoutPct,
        mroi_hurdle: mroiHurdle,
        cm_floor: cmFloor,
        lift_factor: liftFactor,
        justification: justification || undefined,
        projection: freezeProjection(projection) as unknown as Record<string, unknown>,
        trade_spend_budget: projection.expectedTradeSpend,
      })
      if (!draft.ok || !draft.id) {
        setStatus(`error: ${draft.error ?? 'draft failed'}`)
        return
      }
      const issue = await issueAction(draft.id)
      if (issue.ok) {
        setStatus(`issued — treatment ${issue.treatmentSize}, holdout ${issue.holdoutSize}`)
        router.push(`/analytics/campaigns/${draft.id}`)
      } else {
        setStatus(`error: ${issue.error ?? 'issuance failed'}`)
      }
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#3d1825]" style={{ backgroundColor: 'rgba(15,15,18,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
          <div>
            <span className="eyebrow text-[#B8922A]">HD Analytics · Campaigns</span>
            <h1 className="font-display text-[1.4rem] tracking-editorial text-[#FEF2E3] leading-tight mt-0.5">
              Design <span className="italic">an offer.</span>
            </h1>
          </div>
          <Link href="/analytics/campaigns" className="text-xs tracking-wider uppercase" style={{ color: COLORS.textSecondary }}>
            ← back to list
          </Link>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          <AnalyticsTabs />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <HowToRead title="How to design a campaign">
          <ol className="list-decimal list-inside space-y-2 text-[13px]">
            <li>
              <strong>Pick a segment</strong> (left). The playbook pre-loads the commercially-recommended offer —
              the <em>intent</em> is different for Champions vs At Risk vs Lost. Tweak if you have a reason.
            </li>
            <li>
              <strong>Configure the offer</strong>: type, discount value, min-order, scope. Scope matters:
              &quot;Personalized bundle&quot; gives each customer a voucher tied to <em>their</em> top co-purchase pair —
              much higher relevance than &quot;all items&quot;.
            </li>
            <li>
              <strong>Set governance</strong>: holdout % (random control group — the only honest way to measure lift),
              mROI hurdle (the minimum return your CFO would accept), CM floor (minimum per-order margin).
            </li>
            <li>
              Watch the <strong>Projected economics</strong> panel (right) update live. Above the break-even red line
              on the discount slider = projection fails; below = passes.
            </li>
            <li>
              The <strong>Approval gates</strong> panel shows three checks. If any fail, you can still issue — but
              the override requires a written justification and gets logged.
            </li>
            <li>
              <strong>Save Draft</strong> to review later, or <strong>Issue Campaign</strong> to create vouchers now.
              The holdout group is assigned at issuance and never gets the voucher.
            </li>
          </ol>
        </HowToRead>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Configurator (left) ── */}
          <section className="lg:col-span-3 space-y-4">
            <Card>
              <H3>Campaign name</H3>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border px-3 py-2 text-sm"
                style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
              />
            </Card>

            <Card>
              <H3>1. Segment</H3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_SEGMENTS.map((s) => {
                  const selected = s === segment
                  const count = segmentCounts[s] ?? 0
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSegmentChange(s)}
                      className="text-left px-3 py-2 transition-all"
                      style={{
                        border: `1px solid ${selected ? COLORS.gold : COLORS.cardBorder}`,
                        backgroundColor: selected ? 'rgba(184,146,42,0.1)' : 'transparent',
                      }}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: selected ? COLORS.gold : COLORS.textPrimary }}>
                          {s}
                        </span>
                        <span className="numeral text-[0.85rem]" style={{ color: COLORS.textSecondary }}>{count}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] mt-3 leading-snug" style={{ color: COLORS.textSecondary }}>
                <span style={{ color: COLORS.gold }}>Playbook: </span>{recipe.rationale}
              </p>
            </Card>

            <Card>
              <H3>2. Offer</H3>
              <Row>
                <Label>Type</Label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as OfferType)}
                  className="flex-1 bg-transparent border px-3 py-2 text-sm"
                  style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
                >
                  {OFFER_TYPES.map((t) => <option key={t.value} value={t.value} style={{ backgroundColor: COLORS.card }}>{t.label}</option>)}
                </select>
              </Row>
              <Row>
                <Label>Value</Label>
                <input
                  type="range"
                  min={0} max={offerType.includes('fixed') ? 100000 : 50} step={offerType.includes('fixed') ? 1000 : 1}
                  value={offerValue}
                  onChange={(e) => setOfferValue(Number(e.target.value))}
                  className="flex-1 accent-[#B8922A]"
                />
                <span className="numeral text-sm w-20 text-right" style={{ color: COLORS.textPrimary }}>
                  {offerType.includes('fixed') ? formatRupiah(offerValue) : `${offerValue}%`}
                </span>
              </Row>
              {!offerType.includes('fixed') && (
                <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: COLORS.textMuted }}>
                  <span>Break-even at hurdle ≈ <span style={{ color: COLORS.red }}>{breakEvenValue.toFixed(1)}%</span></span>
                  <span>Recipe max: {recipe.max_discount_pct}%</span>
                </div>
              )}
              <Row>
                <Label>Min order</Label>
                <input
                  type="number" value={minOrder} onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="flex-1 bg-transparent border px-3 py-2 text-sm"
                  style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
                />
              </Row>
              <Row>
                <Label>Scope</Label>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {SCOPES.map((s) => {
                    const selected = s.value === productScope
                    return (
                      <button
                        key={s.value} type="button"
                        onClick={() => setProductScope(s.value)}
                        className="text-left px-2 py-1.5"
                        style={{
                          border: `1px solid ${selected ? COLORS.gold : COLORS.cardBorder}`,
                          backgroundColor: selected ? 'rgba(184,146,42,0.1)' : 'transparent',
                        }}
                      >
                        <div className="text-[11px] font-semibold" style={{ color: selected ? COLORS.gold : COLORS.textPrimary }}>
                          {s.label}
                        </div>
                        <div className="text-[10px]" style={{ color: COLORS.textSecondary }}>{s.hint}</div>
                      </button>
                    )
                  })}
                </div>
              </Row>
            </Card>

            <Card>
              <H3>3. Measurement & governance</H3>
              <Row>
                <Label>Holdout %</Label>
                <input
                  type="range" min={0} max={0.3} step={0.05}
                  value={holdoutPct} onChange={(e) => setHoldoutPct(Number(e.target.value))}
                  className="flex-1 accent-[#B8922A]"
                />
                <span className="numeral text-sm w-20 text-right">{formatPct(holdoutPct, 0)}</span>
              </Row>
              <Row>
                <Label>mROI hurdle</Label>
                <input
                  type="range" min={1.0} max={3.0} step={0.1}
                  value={mroiHurdle} onChange={(e) => setMroiHurdle(Number(e.target.value))}
                  className="flex-1 accent-[#B8922A]"
                />
                <span className="numeral text-sm w-20 text-right">{mroiHurdle.toFixed(1)}×</span>
              </Row>
              <Row>
                <Label>CM floor</Label>
                <input
                  type="number" value={cmFloor} onChange={(e) => setCmFloor(Number(e.target.value))}
                  className="flex-1 bg-transparent border px-3 py-2 text-sm"
                  style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}
                />
                <span className="text-[10px]" style={{ color: COLORS.textSecondary }}>IDR / order</span>
              </Row>
              <Row>
                <Label>Lift factor</Label>
                <input
                  type="range" min={0.5} max={2.0} step={0.1}
                  value={liftFactor} onChange={(e) => setLiftFactor(Number(e.target.value))}
                  className="flex-1 accent-[#B8922A]"
                />
                <span className="numeral text-sm w-20 text-right">{liftFactor.toFixed(1)}×</span>
              </Row>
              <p className="text-[10px] mt-2 leading-snug" style={{ color: COLORS.textMuted }}>
                Lift = expected incremental orders per redeemer vs their baseline. Manual slider given our data size;
                snapshotted into campaign projection for honest actual-vs-projected later.
              </p>
            </Card>

            <Card>
              <H3>4. Window</H3>
              <Row>
                <Label>Start</Label>
                <input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                       className="flex-1 bg-transparent border px-3 py-2 text-sm"
                       style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }} />
              </Row>
              <Row>
                <Label>End</Label>
                <input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                       className="flex-1 bg-transparent border px-3 py-2 text-sm"
                       style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }} />
              </Row>
            </Card>
          </section>

          {/* ── Live projection (right) ── */}
          <aside className="lg:col-span-2 space-y-4">
            <Card highlight>
              <H3>Projected economics</H3>
              <KV k="Eligible" v={projection.eligibleCustomers.toString()} />
              <KV k="Treatment" v={projection.treatmentSize.toString()} hint={`holdout ${projection.holdoutSize}`} tip="holdout" />
              <KV k="Expected redeemers" v={projection.expectedRedeemers.toFixed(1)} tip="redemption_rate" />
              <Hr />
              <KV k="Gross revenue" v={formatRupiah(projection.expectedRevenue)} />
              <KV k="Trade spend" v={formatRupiah(projection.expectedTradeSpend)} tone="dim" tip="trade_spend" />
              <KV k="COGS" v={formatRupiah(projection.expectedCogs)} tone="dim" />
              <KV k="Delivery subsidy" v={formatRupiah(projection.expectedDeliverySubsidy)} tone="dim" />
              <Hr />
              <KV k="Contribution margin" v={formatRupiah(projection.expectedCm)} highlight tip="cm" />
              <KV k="mROI" v={`${projection.expectedMroi.toFixed(2)}×`} tone={projection.expectedMroi >= mroiHurdle ? 'good' : 'bad'} tip="mroi" />
              {recipe.cltv_aware && projection.cltvUplift > 0 && (
                <>
                  <Hr />
                  <KV k="CLTV uplift (90d)" v={formatRupiah(projection.cltvUplift)} hint={`payback ${projection.paybackWeeks}w`} tip="cltv_uplift" />
                </>
              )}
            </Card>

            <Card>
              <H3>Approval gates</H3>
              <Gate label="mROI ≥ hurdle" pass={gates.mroi_gate} detail={`${projection.expectedMroi.toFixed(2)}× vs ${mroiHurdle}×`} />
              <Gate label="CM/order ≥ floor" pass={gates.cm_gate}
                    detail={`${formatRupiah(projection.expectedRedeemers > 0 ? projection.expectedCm / projection.expectedRedeemers : 0)} vs ${formatRupiah(cmFloor)}`} />
              <Gate label="Within segment budget" pass={gates.budget_gate}
                    detail={remainingBudget === null
                      ? 'no budget set for this segment this month'
                      : `${formatRupiah(projection.expectedTradeSpend)} vs ${formatRupiah(remainingBudget)} remaining`} />
              {!gates.all_pass && (
                <div className="mt-3">
                  <p className="text-[10px] mb-1.5" style={{ color: COLORS.red }}>Justification required:</p>
                  <textarea value={justification} onChange={(e) => setJustification(e.target.value)}
                            placeholder="Why override the gate? (logged)"
                            className="w-full bg-transparent border px-3 py-2 text-xs"
                            rows={3}
                            style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }} />
                </div>
              )}
            </Card>

            <div className="flex items-center gap-3">
              <button onClick={onSaveDraft} disabled={isPending}
                      className="flex-1 px-4 py-2.5 text-xs tracking-wider uppercase font-semibold border"
                      style={{ borderColor: COLORS.cardBorder, color: COLORS.textPrimary }}>
                Save draft
              </button>
              <button onClick={onIssue} disabled={isPending}
                      className="flex-1 px-4 py-2.5 text-xs tracking-wider uppercase font-semibold"
                      style={{ backgroundColor: COLORS.gold, color: COLORS.bg }}>
                {isPending ? 'Issuing…' : 'Issue campaign'}
              </button>
            </div>
            {status && (
              <p className="text-[11px]" style={{ color: status.startsWith('error') ? COLORS.red : COLORS.emerald }}>{status}</p>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

function Card({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="p-5" style={{
      backgroundColor: COLORS.card,
      border: `1px solid ${highlight ? COLORS.gold : COLORS.cardBorder}`,
    }}>{children}</div>
  )
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[1rem] text-[#FEF2E3] mb-3">{children}</h3>
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 mb-2">{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] tracking-wider uppercase w-20" style={{ color: COLORS.textSecondary }}>{children}</span>
}
function KV({ k, v, hint, tone, highlight, tip }: {
  k: string; v: string; hint?: string; tone?: 'dim' | 'good' | 'bad'; highlight?: boolean
  tip?: keyof typeof import('../glossary').GLOSSARY
}) {
  const color = tone === 'good' ? COLORS.emerald : tone === 'bad' ? COLORS.red : tone === 'dim' ? COLORS.textSecondary : COLORS.textPrimary
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-[11px] inline-flex items-center gap-1" style={{ color: COLORS.textSecondary }}>
        {k}{tip && <InfoTip term={tip} />}
      </span>
      <span className={`numeral ${highlight ? 'text-[1.1rem]' : 'text-sm'}`} style={{ color }}>
        {v} {hint && <span className="text-[10px] ml-2" style={{ color: COLORS.textMuted }}>{hint}</span>}
      </span>
    </div>
  )
}
function Hr() {
  return <div style={{ borderTop: `1px solid ${COLORS.cardBorder}` }} className="my-2" />
}
function Gate({ label, pass, detail }: { label: string; pass: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span style={{ color: pass ? COLORS.emerald : COLORS.red }}>{pass ? '✓' : '✗'}</span>
      <span className="text-[11px]" style={{ color: COLORS.textPrimary }}>{label}</span>
      <span className="text-[10px] ml-auto" style={{ color: COLORS.textMuted }}>{detail}</span>
    </div>
  )
}
