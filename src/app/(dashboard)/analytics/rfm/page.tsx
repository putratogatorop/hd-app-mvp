import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRFMData, requireStaff, type RFMData } from '@/lib/dashboard/real-metrics'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import RFMClient from './RFMClient'

export const dynamic = 'force-dynamic'

/** Apply tier filter post-hoc — RFM is pre-aggregated per customer, so the
 *  tier slicer works as a display-time filter over the computed segments. */
function filterRFMByTier(data: RFMData, tiers: string[] | undefined): RFMData {
  if (!tiers || tiers.length === 0) return data
  const set = new Set(tiers)
  const customers = data.customers.filter((c) => set.has(c.tier))
  // Recompute segment rollup from the filtered customer list
  const segMap = new Map<string, { count: number; revenue: number }>()
  for (const c of customers) {
    const s = segMap.get(c.segment) ?? { count: 0, revenue: 0 }
    s.count += 1
    s.revenue += c.monetary
    segMap.set(c.segment, s)
  }
  const segments = data.segments
    .filter((s) => segMap.has(s.name))
    .map((s) => ({ ...s, ...segMap.get(s.name)! }))
  const bucket = (name: string) => customers.filter((c) => c.segment === name)
  return {
    ...data,
    customers,
    segments,
    totals: {
      customers: customers.length,
      champions: bucket('Champions').length,
      loyal: bucket('Loyal').length,
      atRisk: bucket('At Risk').length,
      cannotLose: bucket('Cannot Lose').length,
      lost: bucket('Lost').length,
      totalRevenue: customers.reduce((s, c) => s + c.monetary, 0),
      championRevenue: bucket('Champions').reduce((s, c) => s + c.monetary, 0),
      atRiskRevenue: bucket('At Risk').reduce((s, c) => s + c.monetary, 0),
    },
    sampleSize: customers.length,
  }
}

export default async function RFMPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const { filters } = parseFilterSearchParams(sp)

  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [raw, stores] = await Promise.all([
    getRFMData(supabase),
    fetchStoresForFilter(supabase),
  ])
  const data = filterRFMByTier(raw, filters.tiers)

  return <RFMClient data={data} stores={stores} />
}
