// Semantic-layer types — the single contract every analytics page uses.
// Filters → views → measures. Inspired by dbt + LookML.

export type Channel = 'pickup' | 'delivery' | 'dinein'
export type Tier = 'silver' | 'gold' | 'platinum'

/** Canonical filter object. All data functions accept this. */
export interface Filters {
  /** ISO datetime (inclusive). */
  from?: string
  /** ISO datetime (exclusive). */
  to?: string
  /** Restrict to these store UUIDs. Empty/undefined = all stores. */
  storeIds?: string[]
  /** Restrict to these channels. */
  channels?: Channel[]
  /** Restrict to these customer tiers. */
  tiers?: Tier[]
  /** true = gifts only, false = non-gift only, undefined = both. */
  isGift?: boolean
  /** Restrict to orders that used a specific voucher (by UUID). */
  voucherIds?: string[]
  /** true = voucher-redeemed orders only, false = full-price only, undefined = both. */
  hasVoucher?: boolean
  /** Exclude cancelled orders by default. Set false to include all statuses. */
  excludeCancelled?: boolean
}

/** One row from v_orders_enriched. */
export interface EnrichedOrder {
  order_id: string
  created_at: string
  updated_at: string | null
  scheduled_for: string | null
  status: string
  user_id: string
  store_id: string | null
  store_name: string | null
  channel: Channel | null
  is_gift: boolean
  payment_method: string | null
  voucher_id: string | null
  voucher_code: string | null
  voucher_title: string | null
  voucher_discount_type: string | null
  voucher_discount_value: number | null
  gross_revenue: number
  discount_amount: number
  delivery_fee: number
  net_revenue: number
  points_earned: number | null
  table_number: string | null
  tier: Tier | null
  customer_name: string | null
  customer_email: string | null
  recipient_name: string | null
  gift_message: string | null
  hour_of_day: number
  iso_dow: number
}

/** One row from v_order_items_enriched. */
export interface EnrichedOrderItem {
  order_item_id: string
  order_id: string
  menu_item_id: string | null
  product_name: string | null
  product_category: string | null
  quantity: number
  unit_price: number
  line_revenue: number
  created_at: string
  user_id: string
  store_id: string | null
  channel: Channel | null
  is_gift: boolean
  status: string
  voucher_id: string | null
  tier: Tier | null
}

/** One row from v_customers_rfm. */
export interface CustomerRFMRow {
  user_id: string
  name: string
  email: string
  tier: Tier
  last_order_at: string
  recency_days: number
  frequency: number
  monetary: number
}

// ─── Campaigns / Promotional Investment Optimization ──────────────────

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'archived'
export type OfferType =
  | 'percent'
  | 'fixed'
  | 'bundle_percent'
  | 'bundle_fixed'
  | 'tier_unlock'
  | 'bogo'
export type ProductScope = 'all' | 'items' | 'personalized_pair' | 'category'

export interface CampaignProjection {
  redeemers: number
  revenue: number
  trade_spend: number
  cogs: number
  cm: number
  mroi: number
  break_even_value: number
  cltv_uplift: number
  payback_weeks: number
  skipped_user_ids?: string[]
  gate_overrides?: string[]
}

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  segment_key: string
  targeting_filters: Record<string, unknown>
  offer_type: OfferType
  offer_value: number
  min_order: number
  max_discount: number | null
  product_scope: ProductScope
  applicable_items: string[] | null
  applicable_categories: string[] | null
  start_at: string | null
  end_at: string | null
  holdout_pct: number
  mroi_hurdle: number
  cm_floor: number
  lift_factor: number
  justification: string | null
  projection: CampaignProjection | null
  trade_spend_budget: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/** Joined outcome row from v_campaign_outcomes. */
export interface CampaignOutcome {
  campaign_id: string
  name: string
  status: CampaignStatus
  segment_key: string
  offer_type: OfferType
  offer_value: number
  product_scope: ProductScope
  start_at: string | null
  end_at: string | null
  mroi_hurdle: number
  cm_floor: number
  issued: number
  redeemed: number
  redemption_rate: number
  actual_revenue: number
  actual_trade_spend: number
  actual_cm: number
  actual_gross_mroi: number
  incremental_orders: number
  incremental_revenue: number
  incremental_cm: number
  mroi: number
  cannibalization_ratio: number
  redemption_liability: number
  projected_redeemers: number
  projected_revenue: number
  projected_trade_spend: number
  projected_cm: number
  projected_mroi: number
}

/** Per-segment historical baseline (from v_segment_baselines). */
export interface SegmentBaseline {
  segment_key: string
  customer_count: number
  avg_order_value: number
  total_revenue: number
  vouchers_issued: number
  vouchers_redeemed: number
  base_redemption_rate: number
  cm_pct: number
  base_order_rate_90d: number
}

/** Per-SKU margin row (from v_menu_item_margins). */
export interface MenuItemMargin {
  menu_item_id: string
  name: string
  category: string
  price: number
  cost_price: number
  gross_margin: number
  gm_pct: number
}

/** Per-user co-purchase pair row. */
export interface CustomerTopPair {
  user_id: string
  item_a: string
  item_b: string
  pair_count: number
  rank: number
}

export interface CategoryMix {
  user_id: string
  category: string
  revenue: number
  share: number
}

export interface RedemptionPropensity {
  user_id: string
  issued: number
  redeemed: number
  propensity: number
}

export interface TradeSpendPacing {
  month: string
  segment_key: string
  budget_amount: number
  mtd_spend: number
  remaining_budget: number
  pace_pct: number
}

export interface Incrementality {
  campaign_id: string
  treatment_size: number
  holdout_size: number
  treatment_orders: number
  holdout_orders: number
  treatment_order_rate: number
  holdout_order_rate: number
  incremental_orders: number
  incremental_revenue: number
  incremental_cm: number
  trade_spend: number
  mroi: number
  cannibalization_ratio: number
}

export interface CampaignTarget {
  campaign_id: string
  user_id: string
  is_holdout: boolean
  top_pair_a: string | null
  top_pair_b: string | null
  voucher_id: string | null
  created_at: string
}
