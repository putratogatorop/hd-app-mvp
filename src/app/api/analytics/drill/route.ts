import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/dashboard/real-metrics'
import { fetchEnrichedOrders } from '@/lib/dashboard/semantic'
import type { Filters } from '@/lib/dashboard/semantic'

export const dynamic = 'force-dynamic'

interface DrillBody {
  filters: Filters
  /** ISO day-of-week (1=Mon..7=Sun). Optional drill key. */
  isoDow?: number
  /** Hour of day (0–23). Optional drill key. */
  hour?: number
  /** Product name to filter on (via order-items). Optional. */
  product?: string
  limit?: number
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (role !== 'staff' && role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = (await req.json().catch(() => null)) as DrillBody | null
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const filters = body.filters ?? {}
  const rows = await fetchEnrichedOrders(supabase, filters)

  let filtered = rows
  if (typeof body.isoDow === 'number') {
    filtered = filtered.filter((r) => r.iso_dow === body.isoDow)
  }
  if (typeof body.hour === 'number') {
    filtered = filtered.filter((r) => r.hour_of_day === body.hour)
  }

  const limit = Math.min(body.limit ?? 100, 500)
  const trimmed = filtered.slice(0, limit)

  return NextResponse.json({
    total: filtered.length,
    returned: trimmed.length,
    rows: trimmed.map((r) => ({
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
    })),
  })
}
