// Pure economic functions for the simulator.
// No Supabase, no React — unit-testable.
//
// Conventions:
//   - amounts in IDR
//   - discount values: percent in [0..100] for percentage types;
//     fixed in IDR for fixed types
//   - liftFactor: multiplier on baseline order rate (e.g. 1.2 = 20% lift
//     in orders per redeemer over campaign window)

import type {
  CampaignProjection,
  OfferType,
  ProductScope,
  SegmentBaseline,
} from '@/lib/dashboard/semantic/types'

const DEFAULT_DELIVERY_SUBSIDY = 8000  // IDR per delivery order (configurable later)

export interface ProjectionInput {
  segmentCustomerCount: number
  segment: SegmentBaseline              // historical baselines for the segment
  offerType: OfferType
  offerValue: number                    // percent (0..100) or fixed IDR
  minOrder: number
  maxDiscount: number | null
  productScope: ProductScope
  holdoutPct: number                    // 0..1
  liftFactor: number                    // manual slider, default 1.0
  deliverySubsidyPerOrder?: number
  /** Segment-weighted GM% — derived from menu_item_margins, defaults to segment.cm_pct */
  weightedGmPct?: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Convert offer to an effective discount fraction (0..1) against a baseline AOV.
 *  Used by redemption rate and break-even math. */
export function effectiveDiscountPct(
  offerType: OfferType,
  offerValue: number,
  baselineAov: number,
  maxDiscount: number | null,
): number {
  if (baselineAov <= 0) return 0
  let raw = 0
  if (offerType === 'percent' || offerType === 'bundle_percent' || offerType === 'tier_unlock') {
    raw = offerValue / 100
  } else if (offerType === 'fixed' || offerType === 'bundle_fixed') {
    raw = offerValue / baselineAov
  } else if (offerType === 'bogo') {
    // buy 2 get 3rd 50% = effective ~17%
    raw = offerValue / 100
  }
  if (maxDiscount && maxDiscount > 0) {
    const cap = maxDiscount / baselineAov
    raw = Math.min(raw, cap)
  }
  return clamp(raw, 0, 0.95)
}

/** Projected redemption rate for a segment + offer + scope.
 *
 *  Heuristic model:
 *    rate = base_redemption × offer_attractiveness × scope_penalty × propensity_adj
 *
 *  - offer_attractiveness scales with distance from 10% reference point
 *    (k = 2.0 — a 10pp bump in discount ~doubles attractiveness)
 *  - scope_penalty reflects narrower offer = lower redemption in aggregate
 *  - clamped to [0.02, 0.75]
 */
export function projectRedemption(input: ProjectionInput): number {
  const d = effectiveDiscountPct(
    input.offerType,
    input.offerValue,
    input.segment.avg_order_value,
    input.maxDiscount,
  )
  const base = input.segment.base_redemption_rate || 0.15
  const attractiveness = 1 + 2.0 * (d - 0.10)
  const scopePenalty =
    input.productScope === 'all' ? 1.0 :
    input.productScope === 'personalized_pair' ? 0.90 :
    input.productScope === 'category' ? 0.85 :
    0.75  // 'items'
  return clamp(base * attractiveness * scopePenalty, 0.02, 0.75)
}

export interface ProjectionResult {
  eligibleCustomers: number
  treatmentSize: number
  holdoutSize: number
  expectedRedeemers: number
  expectedRevenue: number
  expectedTradeSpend: number
  expectedCogs: number
  expectedDeliverySubsidy: number
  expectedCm: number
  expectedMroi: number
  breakEvenValue: number           // offer_value at which mROI == hurdle (directional)
  cltvUplift: number               // IDR forward revenue uplift (for win-back)
  paybackWeeks: number             // weeks to recover trade spend from forward orders
  cannibalizationRisk: number      // 0..1, heuristic
}

export function projectCampaign(
  input: ProjectionInput,
  mroiHurdle: number,
): ProjectionResult {
  const {
    segmentCustomerCount, segment, offerType, offerValue, maxDiscount,
    productScope, holdoutPct, liftFactor,
  } = input

  const eligible = segmentCustomerCount
  const holdoutSize = Math.floor(eligible * clamp(holdoutPct, 0, 0.5))
  const treatmentSize = eligible - holdoutSize

  const redemptionRate = projectRedemption(input)
  const expectedRedeemers = treatmentSize * redemptionRate

  const aov = segment.avg_order_value
  const revenuePerRedeemer = aov * liftFactor
  const expectedRevenue = expectedRedeemers * revenuePerRedeemer

  const discountPct = effectiveDiscountPct(offerType, offerValue, aov, maxDiscount)
  const discountPerOrder =
    offerType === 'percent' || offerType === 'bundle_percent' || offerType === 'tier_unlock' || offerType === 'bogo'
      ? Math.min(revenuePerRedeemer * discountPct, maxDiscount ?? Infinity)
      : Math.min(offerValue, revenuePerRedeemer * 0.95)
  const expectedTradeSpend = expectedRedeemers * discountPerOrder

  const gmPct = input.weightedGmPct ?? segment.cm_pct ?? 0.55
  const expectedCogs = expectedRevenue * (1 - gmPct)

  const deliverySubsidy = input.deliverySubsidyPerOrder ?? DEFAULT_DELIVERY_SUBSIDY
  // assume half of orders are delivery (conservative); future: pull from channel mix
  const expectedDeliverySubsidy = expectedRedeemers * deliverySubsidy * 0.5

  const expectedCm = expectedRevenue - expectedTradeSpend - expectedCogs - expectedDeliverySubsidy
  const expectedMroi = expectedTradeSpend > 0 ? expectedCm / expectedTradeSpend : 0

  // Break-even offer value at which projected mROI == hurdle.
  // Approximation: solve for discount_pct where
  //    CM = hurdle × TradeSpend
  //    (revenue - discount - cogs - delivery) = hurdle × discount
  //    revenue - cogs - delivery = discount × (hurdle + 1)
  //    discount = (revenue - cogs - delivery) / (hurdle + 1)
  const grossPerOrder = revenuePerRedeemer - revenuePerRedeemer * (1 - gmPct) - deliverySubsidy * 0.5
  const breakEvenDiscountPerOrder = grossPerOrder / (mroiHurdle + 1)
  const breakEvenValue =
    offerType === 'percent' || offerType === 'bundle_percent' || offerType === 'tier_unlock' || offerType === 'bogo'
      ? Math.max(0, (breakEvenDiscountPerOrder / Math.max(revenuePerRedeemer, 1)) * 100)
      : Math.max(0, breakEvenDiscountPerOrder)

  // CLTV uplift (win-back segments only): assume discount lifts 90-day retention
  // by 20% of its current rate, applied to baseline 90-day revenue.
  const cltvUplift = segment.base_order_rate_90d > 0
    ? expectedRedeemers * aov * segment.base_order_rate_90d * 0.20
    : 0

  // Payback = trade_spend / (weekly incremental gross margin)
  const weeklyIncrementalGm = expectedCm > 0 ? (cltvUplift * gmPct) / 13 : 0
  const paybackWeeks = expectedTradeSpend > 0 && weeklyIncrementalGm > 0
    ? Math.ceil(expectedTradeSpend / weeklyIncrementalGm)
    : 0

  // Cannibalization risk heuristic: high frequency × narrow scope = low risk;
  // high base_redemption_rate × 'all' scope = high risk (most redemptions
  // would have happened anyway).
  const cannibalizationRisk = clamp(
    segment.base_order_rate_90d > 0
      ? (segment.base_redemption_rate * (productScope === 'all' ? 1.0 : 0.6))
      : 0.2,
    0, 0.95,
  )

  return {
    eligibleCustomers: eligible,
    treatmentSize,
    holdoutSize,
    expectedRedeemers,
    expectedRevenue,
    expectedTradeSpend,
    expectedCogs,
    expectedDeliverySubsidy,
    expectedCm,
    expectedMroi,
    breakEvenValue,
    cltvUplift,
    paybackWeeks,
    cannibalizationRisk,
  }
}

/** Freeze a ProjectionResult into the JSONB shape that gets stored on campaigns.projection. */
export function freezeProjection(p: ProjectionResult): CampaignProjection {
  return {
    redeemers: round(p.expectedRedeemers, 2),
    revenue: round(p.expectedRevenue, 0),
    trade_spend: round(p.expectedTradeSpend, 0),
    cogs: round(p.expectedCogs, 0),
    cm: round(p.expectedCm, 0),
    mroi: round(p.expectedMroi, 3),
    break_even_value: round(p.breakEvenValue, 2),
    cltv_uplift: round(p.cltvUplift, 0),
    payback_weeks: p.paybackWeeks,
  }
}

function round(n: number, places: number): number {
  const f = Math.pow(10, places)
  return Math.round(n * f) / f
}

export interface ApprovalGateResult {
  mroi_gate: boolean
  cm_gate: boolean
  budget_gate: boolean
  all_pass: boolean
  failed: string[]
}

export function evaluateGates(
  p: ProjectionResult,
  mroiHurdle: number,
  cmFloor: number,
  remainingBudget: number | null,
): ApprovalGateResult {
  const mroi_gate = p.expectedMroi >= mroiHurdle
  const cmPerRedeemer = p.expectedRedeemers > 0 ? p.expectedCm / p.expectedRedeemers : 0
  const cm_gate = cmPerRedeemer >= cmFloor
  const budget_gate = remainingBudget === null ? true : p.expectedTradeSpend <= remainingBudget

  const failed: string[] = []
  if (!mroi_gate) failed.push(`mROI ${p.expectedMroi.toFixed(2)}× below hurdle ${mroiHurdle}×`)
  if (!cm_gate) failed.push(`CM/order ${Math.round(cmPerRedeemer)} below floor ${cmFloor}`)
  if (!budget_gate && remainingBudget !== null) {
    failed.push(`Trade spend ${Math.round(p.expectedTradeSpend)} exceeds remaining budget ${Math.round(remainingBudget)}`)
  }

  return {
    mroi_gate, cm_gate, budget_gate,
    all_pass: mroi_gate && cm_gate && budget_gate,
    failed,
  }
}
