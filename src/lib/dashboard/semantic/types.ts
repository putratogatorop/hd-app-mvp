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
