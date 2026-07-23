// Static-fixture replacement for the Supabase-backed semantic/queries.ts.
// Every exported function keeps the same name/shape as the production
// version — callers (real-metrics.ts, campaign pages) are unchanged — but
// reads from the in-memory fixture arrays instead of issuing network calls.

import type {
  Filters,
  EnrichedOrder,
  EnrichedOrderItem,
  CustomerRFMRow,
  Campaign,
  CampaignOutcome,
  SegmentBaseline,
  MenuItemMargin,
  CustomerTopPair,
  CategoryMix,
  RedemptionPropensity,
  TradeSpendPacing,
  Incrementality,
  CampaignTarget,
} from './types'
import { ORDERS, ORDER_ITEMS } from '@/fixtures/orders.fixture'
import { STORES } from '@/fixtures/stores.fixture'
import { CUSTOMERS_RFM } from '@/fixtures/rfm.fixture'
import {
  CAMPAIGN_OUTCOMES,
  SEGMENT_BASELINES,
  MENU_ITEM_MARGINS,
  TRADE_SPEND_PACING,
  INCREMENTALITY,
  CAMPAIGN_TARGETS,
} from '@/fixtures/campaigns.fixture'
import { getAllCampaigns } from '@/lib/dashboard/campaigns/mock-actions'

/** Same predicate the production version applies via Supabase query-builder
 *  chains (.gte/.lt/.in/.eq/.not/.is/.neq) — just as a plain array filter. */
export function applyFiltersToOrders<T extends { created_at: string; store_id: string | null; channel: string | null; tier: string | null; is_gift: boolean; voucher_id: string | null; status: string }>(
  rows: T[],
  f: Filters,
): T[] {
  return rows.filter((o) => {
    if (f.from && o.created_at < f.from) return false
    if (f.to && o.created_at >= f.to) return false
    if (f.storeIds && f.storeIds.length > 0 && (!o.store_id || !f.storeIds.includes(o.store_id))) return false
    if (f.channels && f.channels.length > 0 && (!o.channel || !f.channels.includes(o.channel as never))) return false
    if (f.tiers && f.tiers.length > 0 && (!o.tier || !f.tiers.includes(o.tier as never))) return false
    if (typeof f.isGift === 'boolean' && o.is_gift !== f.isGift) return false
    if (f.voucherIds && f.voucherIds.length > 0 && (!o.voucher_id || !f.voucherIds.includes(o.voucher_id))) return false
    if (f.hasVoucher === true && !o.voucher_id) return false
    if (f.hasVoucher === false && o.voucher_id) return false
    if (f.excludeCancelled !== false && o.status === 'cancelled') return false
    return true
  })
}

const ORDERS_ROW_LIMIT = 10_000
const ITEMS_ROW_LIMIT = 20_000

/** Fetch enriched order rows matching filters. Returns newest first. */
export async function fetchEnrichedOrders(filters: Filters = {}): Promise<EnrichedOrder[]> {
  const filtered = applyFiltersToOrders(ORDERS, filters)
  const sorted = [...filtered].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return sorted.slice(0, ORDERS_ROW_LIMIT)
}

/** Fetch enriched order-item rows matching filters. */
export async function fetchEnrichedOrderItems(filters: Filters = {}): Promise<EnrichedOrderItem[]> {
  const filtered = applyFiltersToOrders(ORDER_ITEMS, filters)
  const sorted = [...filtered].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return sorted.slice(0, ITEMS_ROW_LIMIT)
}

/** Fetch the store list for FilterBar dropdowns. */
export async function fetchStoresForFilter(): Promise<Array<{ id: string; name: string }>> {
  return STORES.map((s) => ({ id: s.id, name: s.name })).sort((a, b) => a.name.localeCompare(b.name))
}

// ─── Campaigns / promotional investment queries ─────────────────────

export async function fetchCampaigns(): Promise<Campaign[]> {
  return [...getAllCampaigns()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  return getAllCampaigns().find((c) => c.id === id) ?? null
}

/** Zero-stat outcome row for a campaign that has no fixture-authored history
 *  yet (e.g. a draft just created in the Simulator) — mirrors what a fresh
 *  row in v_campaign_outcomes looks like before any orders reference it. */
function zeroOutcomeFor(c: Campaign): CampaignOutcome {
  const p = c.projection
  return {
    campaign_id: c.id,
    name: c.name,
    status: c.status,
    segment_key: c.segment_key,
    offer_type: c.offer_type,
    offer_value: c.offer_value,
    product_scope: c.product_scope,
    start_at: c.start_at,
    end_at: c.end_at,
    mroi_hurdle: c.mroi_hurdle,
    cm_floor: c.cm_floor,
    issued: 0,
    redeemed: 0,
    redemption_rate: 0,
    actual_revenue: 0,
    actual_trade_spend: 0,
    actual_cm: 0,
    actual_gross_mroi: 0,
    incremental_orders: 0,
    incremental_revenue: 0,
    incremental_cm: 0,
    mroi: 0,
    cannibalization_ratio: 0,
    redemption_liability: 0,
    projected_redeemers: p?.redeemers ?? 0,
    projected_revenue: p?.revenue ?? 0,
    projected_trade_spend: p?.trade_spend ?? 0,
    projected_cm: p?.cm ?? 0,
    projected_mroi: p?.mroi ?? 0,
  }
}

export async function fetchCampaignOutcomes(): Promise<CampaignOutcome[]> {
  const all = getAllCampaigns()
  const byId = new Map(all.map((c) => [c.id, c]))
  const known = new Set(CAMPAIGN_OUTCOMES.map((o) => o.campaign_id))
  const withStatusOverrides = CAMPAIGN_OUTCOMES.map((o) => {
    const c = byId.get(o.campaign_id)
    return c && c.status !== o.status ? { ...o, status: c.status } : o
  })
  const extra = all.filter((c) => !known.has(c.id)).map(zeroOutcomeFor)
  return [...withStatusOverrides, ...extra].sort((a, b) => ((a.start_at ?? '') < (b.start_at ?? '') ? 1 : -1))
}

export async function fetchCampaignIncrementality(campaignId?: string): Promise<Incrementality[]> {
  return campaignId ? INCREMENTALITY.filter((i) => i.campaign_id === campaignId) : INCREMENTALITY
}

export async function fetchCampaignTargets(campaignId: string): Promise<CampaignTarget[]> {
  return CAMPAIGN_TARGETS.filter((t) => t.campaign_id === campaignId)
}

export async function fetchMenuItemMargins(): Promise<MenuItemMargin[]> {
  return [...MENU_ITEM_MARGINS].sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchSegmentBaselines(): Promise<SegmentBaseline[]> {
  return SEGMENT_BASELINES
}

// Not on the rendering path for the static bundle — issue.ts's real-database
// personalization is replaced by mock-actions.ts, so these just return empty.
export async function fetchCustomerTopPairs(_userIds: string[]): Promise<CustomerTopPair[]> {
  return []
}
export async function fetchCategoryMix(): Promise<CategoryMix[]> {
  return []
}
export async function fetchRedemptionPropensity(): Promise<RedemptionPropensity[]> {
  return []
}

export async function fetchTradeSpendPacing(): Promise<TradeSpendPacing[]> {
  return [...TRADE_SPEND_PACING].sort((a, b) => (a.month < b.month ? 1 : -1))
}

/** Fetch per-customer RFM aggregates. */
export async function fetchCustomersRFM(): Promise<CustomerRFMRow[]> {
  return [...CUSTOMERS_RFM].sort((a, b) => b.monetary - a.monetary)
}
