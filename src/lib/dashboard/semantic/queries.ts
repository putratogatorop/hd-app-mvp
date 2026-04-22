import type { createClient } from '@/lib/supabase/server'
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

type Supa = Awaited<ReturnType<typeof createClient>>
// Loose builder shape — Supabase's generated types don't know about our views
// yet, so we stay untyped at the edge and cast the resulting rows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = any

function applyFilters(query: AnyBuilder, f: Filters): AnyBuilder {
  let q = query
  if (f.from) q = q.gte('created_at', f.from)
  if (f.to) q = q.lt('created_at', f.to)
  if (f.storeIds && f.storeIds.length > 0) q = q.in('store_id', f.storeIds)
  if (f.channels && f.channels.length > 0) q = q.in('channel', f.channels)
  if (f.tiers && f.tiers.length > 0) q = q.in('tier', f.tiers)
  if (typeof f.isGift === 'boolean') q = q.eq('is_gift', f.isGift)
  if (f.voucherIds && f.voucherIds.length > 0) q = q.in('voucher_id', f.voucherIds)
  if (f.hasVoucher === true) q = q.not('voucher_id', 'is', null)
  if (f.hasVoucher === false) q = q.is('voucher_id', null)
  if (f.excludeCancelled !== false) q = q.neq('status', 'cancelled')
  return q
}

const ORDERS_ROW_LIMIT = 10000
const ITEMS_ROW_LIMIT = 20000

function isMissingView(err: { message?: string; code?: string } | null, view: string): boolean {
  if (!err) return false
  return err.code === '42P01' || (err.message ?? '').includes(view)
}

/** Fetch enriched order rows matching filters. Returns newest first. */
export async function fetchEnrichedOrders(
  supabase: Supa,
  filters: Filters = {},
): Promise<EnrichedOrder[]> {
  const base = (supabase as unknown as { from: (t: string) => AnyBuilder })
    .from('v_orders_enriched')
    .select('*')
  const filtered = applyFilters(base, filters)
  const { data, error } = await filtered
    .order('created_at', { ascending: false })
    .limit(ORDERS_ROW_LIMIT)
  if (error) {
    if (isMissingView(error, 'v_orders_enriched')) {
      console.warn('[semantic] v_orders_enriched missing — run migration-v3-semantic-layer.sql')
      return []
    }
    throw error
  }
  return (data ?? []) as EnrichedOrder[]
}

/** Fetch enriched order-item rows matching filters. */
export async function fetchEnrichedOrderItems(
  supabase: Supa,
  filters: Filters = {},
): Promise<EnrichedOrderItem[]> {
  const base = (supabase as unknown as { from: (t: string) => AnyBuilder })
    .from('v_order_items_enriched')
    .select('*')
  const filtered = applyFilters(base, filters)
  const { data, error } = await filtered
    .order('created_at', { ascending: false })
    .limit(ITEMS_ROW_LIMIT)
  if (error) {
    if (isMissingView(error, 'v_order_items_enriched')) {
      console.warn('[semantic] v_order_items_enriched missing — run migration-v3-semantic-layer.sql')
      return []
    }
    throw error
  }
  return (data ?? []) as EnrichedOrderItem[]
}

/** Fetch the store list for FilterBar dropdowns. */
export async function fetchStoresForFilter(
  supabase: Supa,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await (supabase as unknown as { from: (t: string) => AnyBuilder })
    .from('stores')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) return []
  return ((data ?? []) as Array<{ id: string; name: string }>).map((s) => ({
    id: s.id, name: s.name,
  }))
}

// ─── Campaigns / promotional investment queries ─────────────────────

async function admin(): Promise<{ from: (t: string) => AnyBuilder }> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  return createAdminClient() as unknown as { from: (t: string) => AnyBuilder }
}

function warnMissing<T>(err: { message?: string; code?: string } | null, view: string, fallback: T): T | null {
  if (!err) return null
  if (isMissingView(err, view)) {
    console.warn(`[semantic] ${view} missing — run migration-v4-campaigns.sql`)
    return fallback
  }
  return null
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    const db = await admin()
    const { data, error } = await db
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      const fb = warnMissing<Campaign[]>(error, 'campaigns', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as Campaign[]
  } catch (e) {
    console.warn('[semantic] fetchCampaigns failed:', e)
    return []
  }
}

export async function fetchCampaign(id: string): Promise<Campaign | null> {
  try {
    const db = await admin()
    const { data, error } = await db.from('campaigns').select('*').eq('id', id).maybeSingle()
    if (error) {
      const fb = warnMissing<Campaign | null>(error, 'campaigns', null)
      if (fb !== null) return fb
      throw error
    }
    return (data ?? null) as Campaign | null
  } catch (e) {
    console.warn('[semantic] fetchCampaign failed:', e)
    return null
  }
}

export async function fetchCampaignOutcomes(): Promise<CampaignOutcome[]> {
  try {
    const db = await admin()
    const { data, error } = await db
      .from('v_campaign_outcomes')
      .select('*')
      .order('start_at', { ascending: false })
    if (error) {
      const fb = warnMissing<CampaignOutcome[]>(error, 'v_campaign_outcomes', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as CampaignOutcome[]
  } catch (e) {
    console.warn('[semantic] fetchCampaignOutcomes failed:', e)
    return []
  }
}

export async function fetchCampaignIncrementality(campaignId?: string): Promise<Incrementality[]> {
  try {
    const db = await admin()
    let q = db.from('v_campaign_incrementality').select('*')
    if (campaignId) q = q.eq('campaign_id', campaignId)
    const { data, error } = await q
    if (error) {
      const fb = warnMissing<Incrementality[]>(error, 'v_campaign_incrementality', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as Incrementality[]
  } catch (e) {
    console.warn('[semantic] fetchCampaignIncrementality failed:', e)
    return []
  }
}

export async function fetchCampaignTargets(campaignId: string): Promise<CampaignTarget[]> {
  try {
    const db = await admin()
    const { data, error } = await db
      .from('campaign_targets')
      .select('*')
      .eq('campaign_id', campaignId)
    if (error) {
      const fb = warnMissing<CampaignTarget[]>(error, 'campaign_targets', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as CampaignTarget[]
  } catch (e) {
    console.warn('[semantic] fetchCampaignTargets failed:', e)
    return []
  }
}

export async function fetchMenuItemMargins(): Promise<MenuItemMargin[]> {
  try {
    const db = await admin()
    const { data, error } = await db.from('v_menu_item_margins').select('*').order('name')
    if (error) {
      const fb = warnMissing<MenuItemMargin[]>(error, 'v_menu_item_margins', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as MenuItemMargin[]
  } catch (e) {
    console.warn('[semantic] fetchMenuItemMargins failed:', e)
    return []
  }
}

export async function fetchSegmentBaselines(): Promise<SegmentBaseline[]> {
  try {
    const db = await admin()
    const { data, error } = await db.from('v_segment_baselines').select('*')
    if (error) {
      const fb = warnMissing<SegmentBaseline[]>(error, 'v_segment_baselines', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as SegmentBaseline[]
  } catch (e) {
    console.warn('[semantic] fetchSegmentBaselines failed:', e)
    return []
  }
}

export async function fetchCustomerTopPairs(userIds: string[]): Promise<CustomerTopPair[]> {
  if (userIds.length === 0) return []
  try {
    const db = await admin()
    const { data, error } = await db
      .from('v_customer_top_pairs')
      .select('*')
      .in('user_id', userIds)
      .eq('rank', 1)
    if (error) {
      const fb = warnMissing<CustomerTopPair[]>(error, 'v_customer_top_pairs', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as CustomerTopPair[]
  } catch (e) {
    console.warn('[semantic] fetchCustomerTopPairs failed:', e)
    return []
  }
}

export async function fetchCategoryMix(): Promise<CategoryMix[]> {
  try {
    const db = await admin()
    const { data, error } = await db.from('v_customer_category_mix').select('*')
    if (error) {
      const fb = warnMissing<CategoryMix[]>(error, 'v_customer_category_mix', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as CategoryMix[]
  } catch (e) {
    console.warn('[semantic] fetchCategoryMix failed:', e)
    return []
  }
}

export async function fetchRedemptionPropensity(): Promise<RedemptionPropensity[]> {
  try {
    const db = await admin()
    const { data, error } = await db.from('v_customer_redemption_propensity').select('*')
    if (error) {
      const fb = warnMissing<RedemptionPropensity[]>(error, 'v_customer_redemption_propensity', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as RedemptionPropensity[]
  } catch (e) {
    console.warn('[semantic] fetchRedemptionPropensity failed:', e)
    return []
  }
}

export async function fetchTradeSpendPacing(): Promise<TradeSpendPacing[]> {
  try {
    const db = await admin()
    const { data, error } = await db
      .from('v_trade_spend_pacing')
      .select('*')
      .order('month', { ascending: false })
    if (error) {
      const fb = warnMissing<TradeSpendPacing[]>(error, 'v_trade_spend_pacing', [])
      if (fb !== null) return fb
      throw error
    }
    return (data ?? []) as TradeSpendPacing[]
  } catch (e) {
    console.warn('[semantic] fetchTradeSpendPacing failed:', e)
    return []
  }
}

/** Fetch per-customer RFM aggregates.
 *  Uses the admin client since the view joins profiles (RLS-protected). */
export async function fetchCustomersRFM(): Promise<CustomerRFMRow[]> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient() as unknown as { from: (t: string) => AnyBuilder }
    const { data, error } = await admin
      .from('v_customers_rfm')
      .select('*')
      .order('monetary', { ascending: false })
      .limit(10000)
    if (error) {
      if (isMissingView(error, 'v_customers_rfm')) {
        console.warn('[semantic] v_customers_rfm missing — run migration-v3-semantic-layer.sql')
        return []
      }
      throw error
    }
    return (data ?? []) as CustomerRFMRow[]
  } catch (e) {
    console.warn('[semantic] RFM admin fetch failed:', e)
    return []
  }
}
