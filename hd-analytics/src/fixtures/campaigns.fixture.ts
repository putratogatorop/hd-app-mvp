// Hand-authored campaigns domain fixture — there's no "raw orders" analog for
// campaigns/vouchers/holdout groups anywhere else in the app, so this is
// authored directly (unlike orders.fixture.ts, which is derived/generated).
// Projections are computed with the real projection.ts math so the numbers
// stay internally consistent with what the Simulator would produce.

import type {
  Campaign, CampaignOutcome, SegmentBaseline, MenuItemMargin,
  TradeSpendPacing, Incrementality, CampaignTarget, OfferType, ProductScope,
} from '@/lib/dashboard/semantic/types'
import type { RFMSegment } from '@/lib/dashboard/real-metrics'
import { projectCampaign, freezeProjection } from '@/lib/dashboard/campaigns/projection'
import { CUSTOMERS, PRODUCTS } from './orders.fixture'

// ── Segment baselines ───────────────────────────────────────────────────
export const SEGMENT_BASELINES: SegmentBaseline[] = [
  { segment_key: 'Champions', customer_count: 35, avg_order_value: 165_000, total_revenue: 17_325_000, vouchers_issued: 70, vouchers_redeemed: 8, base_redemption_rate: 0.12, cm_pct: 0.60, base_order_rate_90d: 3.5 },
  { segment_key: 'Loyal', customer_count: 55, avg_order_value: 120_000, total_revenue: 19_800_000, vouchers_issued: 110, vouchers_redeemed: 20, base_redemption_rate: 0.18, cm_pct: 0.58, base_order_rate_90d: 2.5 },
  { segment_key: 'Potential Loyalists', customer_count: 40, avg_order_value: 95_000, total_revenue: 6_840_000, vouchers_issued: 80, vouchers_redeemed: 20, base_redemption_rate: 0.25, cm_pct: 0.55, base_order_rate_90d: 1.8 },
  { segment_key: 'New Customers', customer_count: 50, avg_order_value: 70_000, total_revenue: 4_200_000, vouchers_issued: 100, vouchers_redeemed: 30, base_redemption_rate: 0.30, cm_pct: 0.50, base_order_rate_90d: 1.2 },
  { segment_key: 'Promising', customer_count: 45, avg_order_value: 85_000, total_revenue: 5_737_500, vouchers_issued: 90, vouchers_redeemed: 20, base_redemption_rate: 0.22, cm_pct: 0.55, base_order_rate_90d: 1.5 },
  { segment_key: 'Needs Attention', customer_count: 45, avg_order_value: 80_000, total_revenue: 3_600_000, vouchers_issued: 90, vouchers_redeemed: 18, base_redemption_rate: 0.20, cm_pct: 0.52, base_order_rate_90d: 1.0 },
  { segment_key: 'At Risk', customer_count: 40, avg_order_value: 110_000, total_revenue: 3_520_000, vouchers_issued: 80, vouchers_redeemed: 22, base_redemption_rate: 0.28, cm_pct: 0.55, base_order_rate_90d: 0.8 },
  { segment_key: 'Cannot Lose', customer_count: 15, avg_order_value: 140_000, total_revenue: 1_050_000, vouchers_issued: 30, vouchers_redeemed: 4, base_redemption_rate: 0.15, cm_pct: 0.58, base_order_rate_90d: 0.5 },
  { segment_key: 'Hibernating', customer_count: 55, avg_order_value: 60_000, total_revenue: 990_000, vouchers_issued: 110, vouchers_redeemed: 20, base_redemption_rate: 0.18, cm_pct: 0.50, base_order_rate_90d: 0.3 },
  { segment_key: 'Lost', customer_count: 40, avg_order_value: 50_000, total_revenue: 200_000, vouchers_issued: 80, vouchers_redeemed: 8, base_redemption_rate: 0.10, cm_pct: 0.45, base_order_rate_90d: 0.1 },
]
const baselineByKey = new Map(SEGMENT_BASELINES.map((b) => [b.segment_key, b]))

// ── Menu item margins — reuse the same product catalogue orders are drawn from ──
const COST_RATIO: Record<string, number> = { Pint: 0.42, Sorbet: 0.38, 'Single Scoop': 0.45, Sundae: 0.40, Cake: 0.35 }
export const MENU_ITEM_MARGINS: MenuItemMargin[] = PRODUCTS.map((p) => {
  const costRatio = COST_RATIO[p.category] ?? 0.42
  const cost = Math.round(p.price * costRatio)
  return {
    menu_item_id: p.name,
    name: p.name,
    category: p.category,
    price: p.price,
    cost_price: cost,
    gross_margin: p.price - cost,
    gm_pct: Math.round((1 - costRatio) * 1000) / 1000,
  }
})

// ── Trade-spend pacing — this month, per segment ────────────────────────
const thisMonth = new Date().toISOString().slice(0, 7)
const PACE_BY_SEGMENT: Record<string, { budget: number; pace: number }> = {
  'Champions': { budget: 2_000_000, pace: 0.15 },
  'Loyal': { budget: 4_500_000, pace: 0.35 },
  'Potential Loyalists': { budget: 6_000_000, pace: 0.55 },
  'New Customers': { budget: 12_000_000, pace: 0.70 },
  'Promising': { budget: 5_500_000, pace: 0.45 },
  'Needs Attention': { budget: 5_000_000, pace: 0.40 },
  'At Risk': { budget: 9_000_000, pace: 0.85 },
  'Cannot Lose': { budget: 3_000_000, pace: 0.60 },
  'Hibernating': { budget: 4_000_000, pace: 0.30 },
  'Lost': { budget: 2_500_000, pace: 0.20 },
}
export const TRADE_SPEND_PACING: TradeSpendPacing[] = Object.entries(PACE_BY_SEGMENT).map(([segment_key, v]) => {
  const mtd_spend = Math.round(v.budget * v.pace)
  return {
    month: thisMonth,
    segment_key,
    budget_amount: v.budget,
    mtd_spend,
    remaining_budget: v.budget - mtd_spend,
    pace_pct: v.pace,
  }
})

// ── Campaigns ────────────────────────────────────────────────────────────
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()
}
function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString()
}

interface CampaignSpec {
  id: string
  name: string
  status: 'draft' | 'active' | 'completed'
  segment_key: RFMSegment
  offer_type: OfferType
  offer_value: number
  min_order: number
  product_scope: ProductScope
  holdout_pct: number
  mroi_hurdle: number
  cm_floor: number
  lift_factor: number
  start_at: string | null
  end_at: string | null
  justification: string | null
  /** Variance multipliers used to fabricate "actual" outcomes from the projection — deterministic, not random. */
  actualRevenueFactor?: number
  actualSpendFactor?: number
  cannibalization?: number
}

const SPECS: CampaignSpec[] = [
  {
    id: 'camp-001', name: 'At Risk — Win-back Bundle', status: 'completed', segment_key: 'At Risk',
    offer_type: 'bundle_percent', offer_value: 25, min_order: 80_000, product_scope: 'personalized_pair',
    holdout_pct: 0.15, mroi_hurdle: 1.5, cm_floor: 5_000, lift_factor: 1.2,
    start_at: daysAgoIso(60), end_at: daysAgoIso(30), justification: null,
    actualRevenueFactor: 1.08, actualSpendFactor: 0.95, cannibalization: 0.28,
  },
  {
    id: 'camp-002', name: 'Champions VIP Bundle', status: 'active', segment_key: 'Champions',
    offer_type: 'bundle_percent', offer_value: 10, min_order: 0, product_scope: 'personalized_pair',
    holdout_pct: 0.10, mroi_hurdle: 1.5, cm_floor: 8_000, lift_factor: 1.0,
    start_at: daysAgoIso(15), end_at: daysFromNowIso(15), justification: null,
    actualRevenueFactor: 0.92, actualSpendFactor: 1.05, cannibalization: 0.62,
  },
  {
    id: 'camp-003', name: 'New Customers — Category Starter', status: 'completed', segment_key: 'New Customers',
    offer_type: 'percent', offer_value: 20, min_order: 90_000, product_scope: 'category',
    holdout_pct: 0.20, mroi_hurdle: 1.3, cm_floor: 3_000, lift_factor: 1.3,
    start_at: daysAgoIso(90), end_at: daysAgoIso(60), justification: null,
    actualRevenueFactor: 1.22, actualSpendFactor: 1.10, cannibalization: 0.18,
  },
  {
    id: 'camp-004', name: 'Lost — Reactivation Test', status: 'draft', segment_key: 'Lost',
    offer_type: 'percent', offer_value: 35, min_order: 0, product_scope: 'all',
    holdout_pct: 0.20, mroi_hurdle: 1.0, cm_floor: 1_000, lift_factor: 1.0,
    start_at: null, end_at: null, justification: 'Below mROI hurdle but treated as acquisition-parity test per playbook.',
  },
  {
    id: 'camp-005', name: 'Cannot Lose — Surgical VIP Save', status: 'active', segment_key: 'Cannot Lose',
    offer_type: 'bundle_percent', offer_value: 25, min_order: 0, product_scope: 'personalized_pair',
    holdout_pct: 0.10, mroi_hurdle: 1.2, cm_floor: 4_000, lift_factor: 1.1,
    start_at: daysAgoIso(10), end_at: daysFromNowIso(20), justification: null,
    actualRevenueFactor: 1.02, actualSpendFactor: 0.98, cannibalization: 0.35,
  },
  {
    id: 'camp-006', name: 'Hibernating — Reactivation', status: 'draft', segment_key: 'Hibernating',
    offer_type: 'percent', offer_value: 30, min_order: 0, product_scope: 'all',
    holdout_pct: 0.20, mroi_hurdle: 1.2, cm_floor: 2_000, lift_factor: 1.0,
    start_at: null, end_at: null, justification: null,
  },
]

const CAMPAIGNS_: Campaign[] = []
const CAMPAIGN_OUTCOMES_: CampaignOutcome[] = []
const INCREMENTALITY_: Incrementality[] = []

for (const spec of SPECS) {
  const baseline = baselineByKey.get(spec.segment_key)!
  const projection = projectCampaign(
    {
      segmentCustomerCount: baseline.customer_count,
      segment: baseline,
      offerType: spec.offer_type,
      offerValue: spec.offer_value,
      minOrder: spec.min_order,
      maxDiscount: null,
      productScope: spec.product_scope,
      holdoutPct: spec.holdout_pct,
      liftFactor: spec.lift_factor,
    },
    spec.mroi_hurdle,
  )
  const frozen = freezeProjection(projection)

  const createdAt = spec.start_at ?? new Date().toISOString()
  CAMPAIGNS_.push({
    id: spec.id,
    name: spec.name,
    status: spec.status,
    segment_key: spec.segment_key,
    targeting_filters: {},
    offer_type: spec.offer_type,
    offer_value: spec.offer_value,
    min_order: spec.min_order,
    max_discount: null,
    product_scope: spec.product_scope,
    applicable_items: null,
    applicable_categories: null,
    start_at: spec.start_at,
    end_at: spec.end_at,
    holdout_pct: spec.holdout_pct,
    mroi_hurdle: spec.mroi_hurdle,
    cm_floor: spec.cm_floor,
    lift_factor: spec.lift_factor,
    justification: spec.justification,
    projection: frozen,
    trade_spend_budget: frozen.trade_spend,
    created_by: null,
    created_at: createdAt,
    updated_at: createdAt,
  })

  const hasActuals = spec.status === 'active' || spec.status === 'completed'
  const revFactor = spec.actualRevenueFactor ?? 1
  const spendFactor = spec.actualSpendFactor ?? 1
  const canni = spec.cannibalization ?? 0.4

  const issued = hasActuals ? Math.round(projection.treatmentSize) : 0
  const redeemed = hasActuals ? Math.round(projection.expectedRedeemers * (revFactor)) : 0
  const actualRevenue = hasActuals ? Math.round(frozen.revenue * revFactor) : 0
  const actualTradeSpend = hasActuals ? Math.round(frozen.trade_spend * spendFactor) : 0
  const actualCogs = Math.round(actualRevenue * (1 - baseline.cm_pct))
  const actualCm = actualRevenue - actualTradeSpend - actualCogs
  const actualGrossMroi = actualTradeSpend > 0 ? actualCm / actualTradeSpend : 0
  const incrementalOrders = hasActuals ? Math.round(redeemed * (1 - canni)) : 0
  const incrementalRevenue = Math.round(actualRevenue * (1 - canni))
  const incrementalCm = Math.round(actualCm * (1 - canni))
  const mroi = actualTradeSpend > 0 ? incrementalCm / actualTradeSpend : 0
  const redemptionLiability = Math.max(0, issued - redeemed) * (redeemed > 0 ? Math.round(actualTradeSpend / redeemed) : 0)

  CAMPAIGN_OUTCOMES_.push({
    campaign_id: spec.id,
    name: spec.name,
    status: spec.status,
    segment_key: spec.segment_key,
    offer_type: spec.offer_type,
    offer_value: spec.offer_value,
    product_scope: spec.product_scope,
    start_at: spec.start_at,
    end_at: spec.end_at,
    mroi_hurdle: spec.mroi_hurdle,
    cm_floor: spec.cm_floor,
    issued,
    redeemed,
    redemption_rate: issued > 0 ? redeemed / issued : 0,
    actual_revenue: actualRevenue,
    actual_trade_spend: actualTradeSpend,
    actual_cm: actualCm,
    actual_gross_mroi: actualGrossMroi,
    incremental_orders: incrementalOrders,
    incremental_revenue: incrementalRevenue,
    incremental_cm: incrementalCm,
    mroi,
    cannibalization_ratio: hasActuals ? canni : 0,
    redemption_liability: redemptionLiability,
    projected_redeemers: Math.round(projection.expectedRedeemers * 100) / 100,
    projected_revenue: frozen.revenue,
    projected_trade_spend: frozen.trade_spend,
    projected_cm: frozen.cm,
    projected_mroi: frozen.mroi,
  })

  if (hasActuals) {
    const treatmentSize = Math.round(projection.treatmentSize)
    const holdoutSize = Math.round(projection.holdoutSize)
    const treatmentOrderRate = redeemed > 0 && treatmentSize > 0 ? Math.min(0.95, (redeemed / treatmentSize) * 1.4) : 0
    const holdoutOrderRate = treatmentOrderRate * (1 - (1 - canni) * 0.5)
    const treatmentOrders = Math.round(treatmentSize * treatmentOrderRate)
    const holdoutOrders = Math.round(holdoutSize * holdoutOrderRate)
    INCREMENTALITY_.push({
      campaign_id: spec.id,
      treatment_size: treatmentSize,
      holdout_size: holdoutSize,
      treatment_orders: treatmentOrders,
      holdout_orders: holdoutOrders,
      treatment_order_rate: treatmentOrderRate,
      holdout_order_rate: holdoutOrderRate,
      incremental_orders: incrementalOrders,
      incremental_revenue: incrementalRevenue,
      incremental_cm: incrementalCm,
      trade_spend: actualTradeSpend,
      mroi,
      cannibalization_ratio: canni,
    })
  }
}

export const CAMPAIGNS: Campaign[] = CAMPAIGNS_
export const CAMPAIGN_OUTCOMES: CampaignOutcome[] = CAMPAIGN_OUTCOMES_
export const INCREMENTALITY: Incrementality[] = INCREMENTALITY_

// ── Campaign targets — only the "hero" completed campaign gets a full list;
//    others render an empty (but non-broken) target table, same as production
//    would show for a campaign whose targets haven't synced yet. ──────────
const HERO_CAMPAIGN_ID = 'camp-001'
const heroSpec = SPECS.find((s) => s.id === HERO_CAMPAIGN_ID)!
const heroProjection = CAMPAIGNS.find((c) => c.id === HERO_CAMPAIGN_ID)!.projection!
const heroHoldoutCount = Math.round((heroProjection.redeemers / (1 - heroSpec.holdout_pct)) * heroSpec.holdout_pct)

const CAMPAIGN_TARGETS_: CampaignTarget[] = []
const targetPool = CUSTOMERS.slice(0, 46)
targetPool.forEach((c, i) => {
  const isHoldout = i < heroHoldoutCount
  const pairA = !isHoldout ? PRODUCTS[i % PRODUCTS.length].name : null
  const pairB = !isHoldout ? PRODUCTS[(i + 3) % PRODUCTS.length].name : null
  CAMPAIGN_TARGETS_.push({
    campaign_id: HERO_CAMPAIGN_ID,
    user_id: c.id,
    is_holdout: isHoldout,
    top_pair_a: pairA,
    top_pair_b: pairB,
    voucher_id: !isHoldout ? `voucher-${HERO_CAMPAIGN_ID}-${i}` : null,
    created_at: heroSpec.start_at ?? new Date().toISOString(),
  })
})
export const CAMPAIGN_TARGETS: CampaignTarget[] = CAMPAIGN_TARGETS_
