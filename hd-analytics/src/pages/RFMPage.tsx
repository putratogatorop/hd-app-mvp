'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from '@/shims/next-navigation'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import { getRFMData, type RFMData } from '@/lib/dashboard/real-metrics'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import type { FilterBarStore } from '@/components/analytics/FilterBar'
import RFMClient from './RFMClient'

/** Apply tier filter post-hoc — RFM is pre-aggregated per customer, so the
 *  tier slicer works as a display-time filter over the computed segments. */
function filterRFMByTier(data: RFMData, tiers: string[] | undefined): RFMData {
  if (!tiers || tiers.length === 0) return data
  const set = new Set(tiers)
  const customers = data.customers.filter((c) => set.has(c.tier))
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

export default function RFMPage() {
  const sp = useSearchParams()
  const [state, setState] = useState<{ data: RFMData; stores: FilterBarStore[] } | null>(null)
  const spString = sp.toString()

  useEffect(() => {
    const { filters } = parseFilterSearchParams(Object.fromEntries(sp.entries()))
    let cancelled = false
    Promise.all([
      getRFMData(),
      fetchStoresForFilter(),
    ]).then(([raw, stores]) => {
      if (!cancelled) setState({ data: filterRFMByTier(raw, filters.tiers), stores })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spString])

  if (!state) return null
  return <RFMClient data={state.data} stores={state.stores} />
}
