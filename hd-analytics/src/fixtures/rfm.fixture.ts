// Derives per-customer RFM aggregates from the synthetic orders dataset —
// mirrors what v_customers_rfm computes in SQL, just done client-side once.

import type { CustomerRFMRow } from '@/lib/dashboard/semantic/types'
import { ORDERS, findCustomer } from './orders.fixture'

const now = Date.now()

function computeCustomersRFM(): CustomerRFMRow[] {
  const byUser = new Map<string, { count: number; monetary: number; lastOrderAt: string }>()
  for (const o of ORDERS) {
    if (o.status === 'cancelled') continue
    const row = byUser.get(o.user_id) ?? { count: 0, monetary: 0, lastOrderAt: o.created_at }
    row.count += 1
    row.monetary += o.net_revenue
    if (o.created_at > row.lastOrderAt) row.lastOrderAt = o.created_at
    byUser.set(o.user_id, row)
  }

  const rows: CustomerRFMRow[] = []
  byUser.forEach((agg, userId) => {
    const customer = findCustomer(userId)
    if (!customer) return
    const recencyDays = Math.max(0, Math.floor((now - Date.parse(agg.lastOrderAt)) / (24 * 3600 * 1000)))
    rows.push({
      user_id: userId,
      name: customer.name,
      email: customer.email,
      tier: customer.tier,
      last_order_at: agg.lastOrderAt,
      recency_days: recencyDays,
      frequency: agg.count,
      monetary: agg.monetary,
    })
  })
  return rows
}

export const CUSTOMERS_RFM: CustomerRFMRow[] = computeCustomersRFM()
