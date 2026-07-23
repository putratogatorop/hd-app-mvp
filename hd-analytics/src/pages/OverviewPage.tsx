'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from '@/shims/next-navigation'
import { parseFilterSearchParams } from '@/lib/dashboard/filter-url'
import { getOverviewRealData } from '@/lib/dashboard/real-metrics'
import type { RealOverviewData, Period } from '@/lib/dashboard/real-metrics'
import { fetchStoresForFilter } from '@/lib/dashboard/semantic'
import type { FilterBarStore } from '@/components/analytics/FilterBar'
import OverviewClient from './OverviewClient'

export default function OverviewPage() {
  const sp = useSearchParams()
  const [state, setState] = useState<{ period: Period; data: RealOverviewData; stores: FilterBarStore[] } | null>(null)
  const spString = sp.toString()

  useEffect(() => {
    const parsed = parseFilterSearchParams(Object.fromEntries(sp.entries()))
    const period: Period = parsed.period === 'custom' ? '30d' : parsed.period
    let cancelled = false
    Promise.all([
      getOverviewRealData(period, parsed.filters),
      fetchStoresForFilter(),
    ]).then(([data, stores]) => {
      if (!cancelled) setState({ period, data, stores })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spString])

  if (!state) return null
  return <OverviewClient period={state.period} data={state.data} stores={state.stores} />
}
