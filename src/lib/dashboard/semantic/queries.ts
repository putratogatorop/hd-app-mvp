import type { createClient } from '@/lib/supabase/server'
import type {
  Filters,
  EnrichedOrder,
  EnrichedOrderItem,
  CustomerRFMRow,
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
