// Replaces the live `POST /api/analytics/drill` call — there's no backend to
// hit in a static bundle, so this re-filters the same orders fixture in
// memory using the identical predicate + isoDow/hour equality checks the
// real API route applied.

import type { Filters } from '@/lib/dashboard/semantic/types'
import { ORDERS } from './orders.fixture'
import { applyFiltersToOrders } from '@/lib/dashboard/semantic/queries'

interface DrillRow {
  order_id: string
  created_at: string
  status: string
  channel: string | null
  store_name: string | null
  customer_name: string | null
  customer_email: string | null
  tier: string | null
  net_revenue: number
  voucher_code: string | null
  is_gift: boolean
}

export function queryDrillRows(
  filters: Filters,
  isoDow?: number,
  hour?: number,
  _product?: string,
  limit = 200,
): { total: number; rows: DrillRow[] } {
  let filtered = applyFiltersToOrders(ORDERS, filters ?? {})
  if (typeof isoDow === 'number') filtered = filtered.filter((r) => r.iso_dow === isoDow)
  if (typeof hour === 'number') filtered = filtered.filter((r) => r.hour_of_day === hour)

  const total = filtered.length
  const rows = filtered.slice(0, Math.min(limit, 500)).map((r) => ({
    order_id: r.order_id,
    created_at: r.created_at,
    status: r.status,
    channel: r.channel,
    store_name: r.store_name,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    tier: r.tier,
    net_revenue: r.net_revenue,
    voucher_code: r.voucher_code,
    is_gift: r.is_gift,
  }))
  return { total, rows }
}
