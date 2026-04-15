import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOverviewRealData, requireStaff } from '@/lib/dashboard/real-metrics'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const state = parseFilterSearchParams(sp)
  // Overview still uses period-over-period deltas, so it needs a Period.
  // For custom ranges we fall back to 30d-style bucketing (period-agnostic math
  // still works inside getOverviewRealData since it reads filters directly).
  const period = state.period === 'custom' ? '30d' : state.period

  const supabase = await createClient()
  const { user, role } = await requireStaff(supabase)
  if (!user) redirect('/login')
  if (role !== 'staff' && role !== 'admin') redirect('/home')

  const [data, stores] = await Promise.all([
    getOverviewRealData(supabase, period, state.filters),
    fetchStoresForFilter(supabase),
  ])

  return <OverviewClient period={period} data={data} stores={stores} />
}
